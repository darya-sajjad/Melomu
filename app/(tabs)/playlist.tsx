import placeholderIcon from "@/assets/icon.png"; // Clean ES6 import
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { memo, useEffect, useState } from "react";
import {
  ActivityIndicator,
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
}

interface HeaderProps {
  title: string;
  songCount: number;
  colors: any;
  onBack: () => void;
}

const OptimizedPlaylistHeader = memo(
  ({ title, songCount, colors, onBack }: HeaderProps) => {
    return (
      <View style={styles.headerContainer}>
        {/* 1. Navigation Icon Header Row */}
        <View style={styles.navRow}>
          <TouchableOpacity onPress={onBack} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </TouchableOpacity>
          <TouchableOpacity activeOpacity={0.7}>
            <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
          </TouchableOpacity>
        </View>

        {/* 2. Massive Centered CD Artwork Image Frame Block */}
        <View style={styles.artworkWrapper}>
          <Image
            source={placeholderIcon}
            style={[styles.mainCdArt, { backgroundColor: colors.surface }]}
            resizeMode="cover"
          />
        </View>

        {/* 3. Playlist Big Text Labels Metadata Block */}
        <Text style={[styles.playlistMainTitle, { color: colors.text }]}>
          {title || "Playlist"}
        </Text>
        <Text
          style={[styles.playlistDescription, { color: colors.textSecondary }]}
        >
          {songCount} {songCount === 1 ? "Song" : "Songs"} • Melomu Smart List
        </Text>
      </View>
    );
  },
);
OptimizedPlaylistHeader.displayName = "OptimizedPlaylistHeader";

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { playSong } = useAudio();

  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function queryFilteredPlaylistTracks() {
      try {
        const db = await dbAsync;
        let queryStr = "SELECT * FROM songs";

        if (id === "recent") {
          queryStr =
            "SELECT * FROM songs WHERE last_played > 0 ORDER BY last_played DESC";
        } else if (id === "most") {
          queryStr =
            "SELECT * FROM songs WHERE play_count >= 3 ORDER BY play_count DESC";
        } else if (id === "least") {
          queryStr =
            "SELECT * FROM songs WHERE play_count < 3 ORDER BY play_count ASC";
        } else if (id === "favorites") {
          queryStr = "SELECT * FROM songs WHERE is_favorite = 1";
        }

        const results = await db.getAllAsync<Song>(queryStr);
        setSongs(results);
      } catch (error) {
        console.error("Failed to fetch categorized songs:", error);
      } finally {
        setIsLoading(false);
      }
    }

    queryFilteredPlaylistTracks();
  }, [id]);

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
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        // Load our optimized static header instance component block
        ListHeaderComponent={
          <OptimizedPlaylistHeader
            title={title || "Playlist"}
            songCount={songs.length}
            colors={colors}
            onBack={() => router.back()}
          />
        }
        contentContainerStyle={styles.listPadding}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tracks found matching this playlist filter rules yet.
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => playSong(item, songs)}
            style={styles.songRowItem}
          >
            {/* Square Track Thumbnail Artwork Box */}
            <Image
              source={placeholderIcon}
              style={[styles.songRowArt, { backgroundColor: colors.surface }]}
            />

            {/* Middle Section: Text Labels Stack block */}
            <View style={styles.metaTextContainer}>
              <Text
                style={[styles.songTitleLabel, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[
                  styles.songArtistLabel,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {item.artist || "Local Audio"}
              </Text>
            </View>

            {/* Right Section: Mini Options Menu Trigger icon dots */}
            <TouchableOpacity activeOpacity={0.6} style={styles.rowMenuButton}>
              <Ionicons
                name="ellipsis-vertical"
                size={18}
                color={colors.textSecondary}
              />
            </TouchableOpacity>
          </TouchableOpacity>
        )}
      />
    </View>
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
  listPadding: {
    paddingBottom: 140, // Keeps bottom rows completely clear of your floating mini player container
  },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48, // Secure spacing cushion handling phone safe regions naturally
    marginBottom: 24,
  },
  navRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    height: 48,
    marginBottom: 16,
  },
  artworkWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    // Soft under shadow layouts look premium for big media grids
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  mainCdArt: {
    width: width * 0.56, // Sizing matching your Figma display proportions
    height: width * 0.56,
    borderRadius: 16,
  },
  playlistMainTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  playlistDescription: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
    paddingHorizontal: 32,
  },
  songRowItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingVertical: 10, // Snug vertical tracking layout rows matching your prototype image
  },
  songRowArt: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 16,
  },
  metaTextContainer: {
    flex: 1,
    paddingRight: 8,
  },
  songTitleLabel: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  songArtistLabel: {
    fontSize: 13,
  },
  rowMenuButton: {
    padding: 8,
  },
});
