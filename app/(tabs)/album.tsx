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
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

export default function AlbumDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const albumName = name || "Unknown Album";
  const { colors } = useTheme();
  const router = useRouter();
  const { playSong } = useAudio();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [customArtwork, setCustomArtwork] = useState<string | null>(null);
  const [coverTimestamp, setCoverTimestamp] = useState(Date.now());

  const fetchAlbumDetails = useCallback(async () => {
    try {
      const db = await dbAsync;

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS album_artworks (
          album TEXT PRIMARY KEY,
          artwork_path TEXT
        );
      `);

      const albumRow = await db.getFirstAsync<{ artwork_path: string }>(
        "SELECT artwork_path FROM album_artworks WHERE album = ?",
        [albumName],
      );

      const result = await db.getAllAsync<Song>(
        "SELECT * FROM songs WHERE album = ?",
        [albumName],
      );

      setSongs(result);

      const firstTrackArtwork = result.find(
        (s) => s.custom_artwork_path,
      )?.custom_artwork_path;

      setCustomArtwork(albumRow?.artwork_path || firstTrackArtwork || null);
    } catch (error) {
      console.error("Failed to load album details:", error);
    } finally {
      setIsLoading(false);
    }
  }, [albumName]);

  useEffect(() => {
    fetchAlbumDetails();
  }, [fetchAlbumDetails]);

  const handleSelectNewAlbumPhoto = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Denied",
          "Melomu needs access to your photo library to set an album cover.",
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

      const safeAlbumFilename = albumName.replace(/[^a-zA-Z0-9]/g, "_");
      const destPath = `${appStorageDirectory}album_${safeAlbumFilename}_cover.jpg`;

      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: destPath,
      });

      const db = await dbAsync;

      await db.runAsync(
        `INSERT INTO album_artworks (album, artwork_path)
         VALUES (?, ?)
         ON CONFLICT(album) DO UPDATE SET artwork_path = excluded.artwork_path`,
        [albumName, destPath],
      );

      await db.runAsync(
        `UPDATE songs 
         SET custom_artwork_path = ?, artwork_source = 'album'
         WHERE album = ? AND (artwork_source IS NULL OR artwork_source = 'album')`,
        [destPath, albumName],
      );

      setCustomArtwork(destPath);
      setCoverTimestamp(Date.now());
      fetchAlbumDetails();
    } catch (error) {
      console.error("Failed to update album cover:", error);
    }
  };

  const promptChangePhoto = () => {
    Alert.alert(
      "Change Album Cover",
      `Do you want to change the artwork for "${albumName}"?`,
      [
        { text: "No", style: "cancel" },
        { text: "Yes", onPress: handleSelectNewAlbumPhoto },
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

  const renderTrack = useCallback(
    ({ item, index }: { item: Song; index: number }) => {
      const trackArtwork = item.custom_artwork_path || customArtwork;

      return (
        <TouchableOpacity
          activeOpacity={0.7}
          style={[
            styles.trackRow,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
          onPress={() => playSong(item, songs)}
        >
          <Text style={[styles.trackIndex, { color: colors.textSecondary }]}>
            {index + 1}
          </Text>
          <Image
            source={
              trackArtwork
                ? { uri: `${trackArtwork}?t=${coverTimestamp}` }
                : placeholderIcon
            }
            style={styles.trackThumb}
            resizeMode="cover"
          />
          <View style={styles.trackMeta}>
            <Text
              style={[styles.trackTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.artistSubtext, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.artist}
            </Text>
          </View>
          <Text style={[styles.trackDuration, { color: colors.textSecondary }]}>
            {formatDuration(item.duration)}
          </Text>
        </TouchableOpacity>
      );
    },
    [colors, customArtwork, coverTimestamp, playSong, songs],
  );

  if (isLoading) {
    return (
      <View
        style={[styles.loadingCenter, { backgroundColor: colors.background }]}
      >
        <ActivityIndicator size="large" color={colors.primary} />
      </View>
    );
  }

  const artistName = songs[0]?.artist || "Unknown Artist";

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() =>
            router.push({
              pathname: "/(tabs)/library",
              params: { tab: "albums" },
            })
          }
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      <View style={styles.albumHeader}>
        <View style={styles.coverContainer}>
          <Image
            source={
              customArtwork
                ? { uri: `${customArtwork}?t=${coverTimestamp}` }
                : placeholderIcon
            }
            style={[styles.squareCoverLarge, { borderColor: colors.surface }]}
            resizeMode="cover"
          />
          <TouchableOpacity
            activeOpacity={0.8}
            onPress={promptChangePhoto}
            style={[
              styles.editBadge,
              {
                backgroundColor: colors.primary,
                borderColor: colors.background,
              },
            ]}
          >
            <Ionicons name="pencil" size={16} color="#FFFFFF" />
          </TouchableOpacity>
        </View>

        <Text style={[styles.albumTitle, { color: colors.text }]}>
          {albumName}
        </Text>
        <Text style={[styles.artistName, { color: colors.textSecondary }]}>
          {artistName} • {songs.length} {songs.length === 1 ? "song" : "songs"}
        </Text>

        {songs.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => playSong(songs[0], songs)}
          >
            <Ionicons name="play" size={20} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={renderTrack}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  topNav: {
    paddingHorizontal: 18,
    marginBottom: 10,
  },
  backBtn: {
    width: 40,
    height: 40,
    justifyContent: "center",
  },
  albumHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  coverContainer: {
    position: "relative",
    marginBottom: 14,
  },
  squareCoverLarge: {
    width: 160,
    height: 160,
    borderRadius: 20,
    borderWidth: 0,
  },
  editBadge: {
    position: "absolute",
    bottom: -8,
    right: -8,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  artistName: {
    fontSize: 14,
    marginBottom: 16,
  },
  playAllBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 20,
    borderRadius: 40,
    gap: 8,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 1,
  },
  trackIndex: {
    width: 20,
    fontSize: 14,
    fontWeight: "600",
    marginRight: 6,
  },
  trackThumb: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 12,
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
  artistSubtext: {
    fontSize: 13,
  },
  trackDuration: {
    fontSize: 13,
    fontWeight: "500",
  },
});
