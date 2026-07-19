import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  View,
} from "react-native";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchSongsFromDatabase() {
      try {
        const db = await dbAsync;
        const result = await db.getAllAsync<Song>("SELECT * FROM songs");
        setSongs(result);
      } catch (error) {
        console.error("Failed to read tracks from SQLite database:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchSongsFromDatabase();
  }, []);

  // Helper function to convert track runtime integers (seconds) to readable text strings (MM:SS)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
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
      <FlatList
        data={songs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No tracks found in your local collection.
          </Text>
        }
        renderItem={({ item }) => (
          <View
            style={[
              styles.songCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Left Block: Track metadata labels */}
            <View style={styles.metaContainer}>
              <Text
                style={[styles.songTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text
                style={[styles.songArtist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.artist} • {item.album}
              </Text>
            </View>

            {/* Right Block: Audio tracking time status */}
            <Text
              style={[styles.durationText, { color: colors.textSecondary }]}
            >
              {formatTime(item.duration)}
            </Text>
          </View>
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
    padding: 16,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 16,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    marginBottom: 12,
    borderWidth: 1,
    // Soft layouts look excellent for list rows
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  metaContainer: {
    flex: 1,
    paddingRight: 16,
  },
  songTitle: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 4,
  },
  songArtist: {
    fontSize: 13,
  },
  durationText: {
    fontSize: 14,
    fontWeight: "500",
  },
});
