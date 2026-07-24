import placeholderIcon from "@/assets/icon.png";
import { Song } from "@/components/library/SongsTab"; // ✨ Import the shared Song type
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    ActivityIndicator,
    FlatList,
    Image,
    Platform,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

export default function AlbumDetailScreen() {
  const { name } = useLocalSearchParams<{ name: string }>();
  const albumName = name || "Unknown Album";
  const { colors } = useTheme();
  const router = useRouter();
  const { playSong } = useAudio();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchAlbumSongs = async () => {
      try {
        const db = await dbAsync;
        const result = await db.getAllAsync<Song>(
          "SELECT * FROM songs WHERE album = ?",
          [albumName],
        );
        setSongs(result);
      } catch (error) {
        console.error("Failed to load album tracks:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAlbumSongs();
  }, [albumName]);

  const formatDuration = (duration: number): string => {
    if (!duration || duration <= 0) return "0:00";
    const totalSeconds =
      duration > 10000 ? Math.floor(duration / 1000) : Math.floor(duration);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const albumArtwork = songs.find(
    (s) => s.custom_artwork_path,
  )?.custom_artwork_path;
  const artistName = songs[0]?.artist || "Unknown Artist";

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
      {/* Header Back Button */}
      <View style={styles.topNav}>
        <TouchableOpacity
          onPress={() => router.push("/(tabs)/library")}
          style={styles.backBtn}
        >
          <Ionicons name="chevron-back" size={28} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Album Card / Smart Playlist Header */}
      <View style={styles.albumHeader}>
        <Image
          source={albumArtwork ? { uri: albumArtwork } : placeholderIcon}
          style={styles.artworkLarge}
        />
        <Text style={[styles.albumTitle, { color: colors.text }]}>
          {albumName}
        </Text>
        <Text style={[styles.albumArtist, { color: colors.textSecondary }]}>
          {artistName} • {songs.length} {songs.length === 1 ? "song" : "songs"}
        </Text>

        {songs.length > 0 && (
          <TouchableOpacity
            activeOpacity={0.8}
            style={[styles.playAllBtn, { backgroundColor: colors.primary }]}
            onPress={() => playSong(songs[0], songs)}
          >
            <Ionicons name="play" size={24} color="#FFFFFF" />
          </TouchableOpacity>
        )}
      </View>

      {/* Album Tracks List */}
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        renderItem={({ item, index }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            style={[
              styles.trackRow,
              {
                backgroundColor: colors.background,
                borderColor: colors.background,
              },
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
                style={[styles.trackArtist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.artist}
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
  albumHeader: {
    alignItems: "center",
    paddingHorizontal: 20,
    marginBottom: 20,
  },
  artworkLarge: {
    width: 150,
    height: 150,
    borderRadius: 20,
    marginBottom: 14,
  },
  albumTitle: {
    fontSize: 22,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
  },
  albumArtist: {
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
  trackArtist: {
    fontSize: 13,
  },
  trackDuration: {
    fontSize: 13,
    fontWeight: "500",
  },
});
