import placeholderIcon from "@/assets/icon.png";
import EditMetaModal from "@/components/EditMetaModal";
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
  custom_artwork_path?: string | null;
}

export default function LibraryScreen() {
  const { colors } = useTheme();
  const { playSong } = useAudio();
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);

  const fetchSongsFromDatabase = async () => {
    try {
      const db = await dbAsync;
      const result = await db.getAllAsync<Song>("SELECT * FROM songs");
      setSongs(result);
    } catch (error) {
      console.error("Failed to read tracks from SQLite database:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchSongsFromDatabase();
    }
  }, [isFocused]);

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
            No tracks found in your local collection. Go to Settings to import
            songs!
          </Text>
        }
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.7}
            onPress={() => playSong(item, songs)}
            onLongPress={() => {
              setEditingSong(item);
              setIsModalVisible(true);
            }}
            style={[
              styles.songCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* ✨ STEP 1: INJECT THE COVER IMAGE HERE (LEFT OF TEXT) */}
            <Image
              source={
                item.custom_artwork_path
                  ? { uri: item.custom_artwork_path }
                  : placeholderIcon
              }
              style={styles.artworkThumbnail}
            />

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

            <Text
              style={[styles.durationText, { color: colors.textSecondary }]}
            >
              {formatTime(item.duration)}
            </Text>
          </TouchableOpacity>
        )}
      />

      {/* The Metadata Editor Modal sits cleanly at the root level outside the FlatList */}
      <EditMetaModal
        isVisible={isModalVisible}
        song={editingSong}
        onClose={() => setIsModalVisible(false)}
        onSaveSuccess={fetchSongsFromDatabase}
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
  artworkThumbnail: {
    width: 48,
    height: 48,
    borderRadius: 8,
  },
});
