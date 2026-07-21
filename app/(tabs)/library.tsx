import placeholderIcon from "@/assets/icon.png";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import EditMetaModal from "@/components/EditMetaModal";
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  FlatList,
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

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
  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const isFocused = useIsFocused();
  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [addingToPlaylistSong, setAddingToPlaylistSong] = useState<Song | null>(
    null,
  );
  const [isAddToPlaylistVisible, setIsAddToPlaylistVisible] = useState(false);

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

  const { playSong, addToQueue } = useAudio();

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
        renderItem={({ item }) => {
          let swipeableRef: Swipeable | null = null;

          const renderRightActions = (
            progress: Animated.AnimatedInterpolation<number>,
            dragX: Animated.AnimatedInterpolation<number>,
          ) => {
            const opacity = dragX.interpolate({
              inputRange: [-80, -20, 0],
              outputRange: [1, 0.5, 0],
              extrapolate: "clamp",
            });

            const scale = dragX.interpolate({
              inputRange: [-80, -20, 0],
              outputRange: [1, 0.8, 0.5],
              extrapolate: "clamp",
            });

            const backgroundColor = dragX.interpolate({
              inputRange: [-80, -30, 0],
              outputRange: [colors.primary, "#404040", colors.background],
              extrapolate: "clamp",
            });

            return (
              <Animated.View
                style={{
                  backgroundColor,
                  justifyContent: "center",
                  alignItems: "flex-end",
                  paddingRight: 24,
                  flex: 1,
                  marginVertical: 4,
                  borderRadius: 12,
                }}
              >
                <Animated.View style={{ opacity, transform: [{ scale }] }}>
                  <Ionicons name="list" size={24} color="#FFFFFF" />
                </Animated.View>
              </Animated.View>
            );
          };

          return (
            <Swipeable
              ref={(ref) => {
                swipeableRef = ref;
              }}
              renderRightActions={renderRightActions}
              overshootRight={false}
              friction={2}
              // ✨ Triggers consistently on swipe open without complex thresholds
              onSwipeableOpen={() => {
                addToQueue(item);
                swipeableRef?.close();
              }}
            >
              <TouchableOpacity
                activeOpacity={0.7}
                onPress={() => playSong(item, songs)}
                onLongPress={() => {
                  setEditingSong(item);
                  setIsModalVisible(true);
                }}
                style={[
                  styles.songCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
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
                <TouchableOpacity
                  activeOpacity={0.6}
                  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                  style={{ marginLeft: 10 }}
                  onPress={() => {
                    setAddingToPlaylistSong(item);
                    setIsAddToPlaylistVisible(true);
                  }}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={22}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </TouchableOpacity>
            </Swipeable>
          );
        }}
      />

      {/* The Metadata Editor Modal sits cleanly at the root level outside the FlatList */}
      <EditMetaModal
        isVisible={isModalVisible}
        song={editingSong}
        onClose={() => setIsModalVisible(false)}
        onSaveSuccess={fetchSongsFromDatabase}
      />
      <AddToPlaylistModal
        isVisible={isAddToPlaylistVisible}
        song={addingToPlaylistSong}
        onClose={() => setIsAddToPlaylistVisible(false)}
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
    marginRight: 14,
  },
});
