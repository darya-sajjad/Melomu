import placeholderIcon from "@/assets/icon.png";
import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import EditMetaModal from "@/components/EditMetaModal";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import {
    Animated,
    FlatList,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
  custom_artwork_path?: string | null;
}

interface SongsTabProps {
  songs: Song[];
  searchQuery: string;
  onRefreshDatabase: () => void;
}

export default function SongsTab({
  songs,
  searchQuery,
  onRefreshDatabase,
}: SongsTabProps) {
  const { colors } = useTheme();
  const { playSong, addToQueue } = useAudio();

  const [editingSong, setEditingSong] = useState<Song | null>(null);
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [addingToPlaylistSong, setAddingToPlaylistSong] = useState<Song | null>(
    null,
  );
  const [isAddToPlaylistVisible, setIsAddToPlaylistVisible] = useState(false);

  const filteredSongs = songs.filter(
    (s) =>
      s.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.artist.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.album.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const formatDuration = (duration: number): string => {
    if (!duration || duration <= 0) return "0:00";
    const totalSeconds =
      duration > 10000 ? Math.floor(duration / 1000) : Math.floor(duration);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View style={styles.container}>
      <FlatList
        data={filteredSongs}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No matching tracks found in your library.
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
                    backgroundColor: colors.background,
                    borderColor: colors.background,
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
                  {formatDuration(item.duration)}
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

      <EditMetaModal
        isVisible={isModalVisible}
        song={editingSong}
        onClose={() => setIsModalVisible(false)}
        onSaveSuccess={onRefreshDatabase}
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
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
  songCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 11,
    borderRadius: 12,
    marginBottom: 4,
    borderWidth: 1,
  },
  metaContainer: {
    flex: 1,
    paddingRight: 12,
  },
  songTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 3,
  },
  songArtist: {
    fontSize: 13,
  },
  durationText: {
    fontSize: 13,
    fontWeight: "500",
  },
  artworkThumbnail: {
    width: 45,
    height: 45,
    borderRadius: 6,
    marginRight: 12,
  },
});
