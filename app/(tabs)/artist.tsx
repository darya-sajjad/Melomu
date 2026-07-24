import placeholderIcon from "@/assets/icon.png";
import { Song } from "@/components/library/SongsTab";
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
    ActivityIndicator,
    Alert,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function ArtistDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const artistName = name || "Unknown Artist";
  const { colors } = useTheme();
  const router = useRouter();
  const { playSong } = useAudio();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customAvatar, setCustomAvatar] = useState<string | null>(null);

  const fetchArtistSongs = useCallback(async () => {
    try {
      const db = await dbAsync;

      // Ensure artist artworks table exists
      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS artist_artworks (
          artist TEXT PRIMARY KEY,
          artwork_path TEXT
        );
      `);

      // Fetch artist avatar from dedicated artist table
      const artistRow = await db.getFirstAsync<{ artwork_path: string }>(
        "SELECT artwork_path FROM artist_artworks WHERE artist = ?",
        [artistName],
      );

      // Fetch tracks for this artist
      const result = await db.getAllAsync<Song>(
        "SELECT * FROM songs WHERE artist = ?",
        [artistName],
      );

      setSongs(result);
      setCustomAvatar(artistRow?.artwork_path || null);
    } catch (error) {
      console.error("Failed to load artist details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [artistName]);

  useEffect(() => {
    fetchArtistSongs();
  }, [fetchArtistSongs]);

  const handleSelectNewArtistPhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Denied",
          "Melomu needs access to your photo library to set an artist photo.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (result.canceled || !result.assets || result.assets.length === 0)
        return;

      const appStorageDirectory = FileSystem.documentDirectory;
      if (!appStorageDirectory) return;

      const safeArtistFilename = artistName.replace(/[^a-zA-Z0-9]/g, "_");
      const destPath = `${appStorageDirectory}artist_${safeArtistFilename}_avatar.jpg`;

      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: destPath,
      });

      // Store ONLY in artist_artworks table so album covers remain unaffected
      const db = await dbAsync;
      await db.runAsync(
        `INSERT INTO artist_artworks (artist, artwork_path)
         VALUES (?, ?)
         ON CONFLICT(artist) DO UPDATE SET artwork_path = excluded.artwork_path`,
        [artistName, destPath],
      );

      setCustomAvatar(destPath);
    } catch (error) {
      console.error("Failed to update artist photo:", error);
    }
  };

  const promptChangePhoto = () => {
    Alert.alert(
      "Change Artist Photo",
      `Do you want to change the photo for ${artistName}?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: handleSelectNewArtistPhoto },
      ],
      { cancelable: true },
    );
  };

  const formatDuration = (duration: number): string => {
    if (!duration || duration <= 0) return "0:00";
    const totalSeconds =
      duration > 10000 ? Math.floor(duration / 1000) : Math.floor(duration);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  if (isLoading) {
    return (
      <View
        style={[styles.loadingCenter, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/library",
              params: { tab: "artists" },
            })
          }
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.artistHeader}>
        <View style={styles.avatarContainer}>
          <Image
            source={customAvatar ? { uri: customAvatar } : placeholderIcon}
            style={styles.circleAvatarLarge}
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={promptChangePhoto}
            style={[styles.editBadge, { backgroundColor: colors.primary }]}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.artistName, { color: colors.text }]}>
          {artistName}
        </Text>
        <Text style={[styles.trackCount, { color: colors.textSecondary }]}>
          {songs.length} {songs.length === 1 ? "song" : "songs"}
        </Text>

        {songs.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => playSong(songs[0], songs)}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
            <Text style={styles.playAllText}>Play Artist Tracks</Text>
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.trackRow,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
            onPress={() => playSong(item, songs)}
          >
            <Text style={[styles.trackIndex, { color: colors.textSecondary }]}>
              {index + 1}
            </Text>
            <View style={styles.trackMeta}>
              <Text
                style={[styles.trackTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.albumSubtext, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.album}
              </Text>
            </View>
            <Text
              style={[styles.trackDuration, { color: colors.textSecondary }]}
            >
              {formatDuration(item.duration)}
            </Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topNav: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  artistHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  avatarContainer: {
    position: "relative",
    marginBottom: 14,
  },
  circleAvatarLarge: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  editBadge: {
    position: "absolute",
    bottom: 2,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: "#000000",
  },
  artistName: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  trackCount: {
    fontSize: 14,
    marginBottom: 16,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 25,
    gap: 8,
  },
  playAllText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 14,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  trackIndex: {
    width: 24,
    fontSize: 14,
    fontWeight: "600",
  },
  trackMeta: {
    flex: 1,
    paddingRight: 12,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  albumSubtext: {
    fontSize: 13,
  },
  trackDuration: {
    fontSize: 13,
    fontWeight: "500",
  },
});
