import placeholderIcon from "@/assets/icon.png";
import EditPlaylistModal from "@/components/Home/EditPlaylistModal";
import SwipeableSongRow from "@/components/library/SwipeableSongRow";
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useLocalSearchParams, useRouter } from "expo-router";
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Dimensions,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { TouchableOpacity as RNGHTouchableOpacity } from "react-native-gesture-handler";
import { useSafeAreaInsets } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
  is_favorite?: number;
  custom_artwork_path?: string | null;
}

interface PlaylistMeta {
  id: string;
  name: string;
  artwork_path: string | null;
}

type ScreenMode = "normal" | "reorder" | "select";

const SMART_PLAYLIST_IDS = ["recent", "most", "least", "favorites"];

export default function PlaylistDetailScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { playSong, toggleFavorite } = useAudio();
  const insets = useSafeAreaInsets();

  const { id, title } = useLocalSearchParams<{ id: string; title: string }>();
  const isCustomPlaylist = !SMART_PLAYLIST_IDS.includes(id || "");
  const isFavoritesPlaylist = id === "favorites";

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [playlistMeta, setPlaylistMeta] = useState<PlaylistMeta | null>(null);

  const [mode, setMode] = useState<ScreenMode>("normal");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditModalVisible, setIsEditModalVisible] = useState(false);

  const loadSongs = useCallback(async () => {
    try {
      const db = await dbAsync;
      let queryStr = "SELECT * FROM songs";
      let queryParams: any[] = [];

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
      } else if (id) {
        queryStr = `
          SELECT s.* FROM songs s
          INNER JOIN playlist_songs ps ON ps.song_id = s.id
          WHERE ps.playlist_id = ?
          ORDER BY ps.position ASC
        `;
        queryParams = [id];
      }

      const results = await db.getAllAsync<Song>(queryStr, queryParams);
      setSongs(results);
    } catch (error) {
      console.error("Failed to fetch categorized songs:", error);
    } finally {
      setIsLoading(false);
    }
  }, [id]);

  const loadPlaylistMeta = useCallback(async () => {
    if (!id) return;
    try {
      const db = await dbAsync;
      setPlaylistMeta(null);
      const row = await db.getFirstAsync<PlaylistMeta>(
        "SELECT id, name, artwork_path FROM playlists WHERE id = ?",
        [id],
      );

      if (row) {
        setPlaylistMeta(row);
      } else {
        setPlaylistMeta({
          id: id,
          name: title || "Automated List",
          artwork_path: null,
        });
      }
    } catch (error) {
      console.error("Failed to load playlist meta:", error);
    }
  }, [id, title]);

  const isFocused = useIsFocused();

  useEffect(() => {
    if (isFocused) {
      loadSongs();
      loadPlaylistMeta();
    }
  }, [isFocused, loadSongs, loadPlaylistMeta]);

  const exitMode = () => {
    setMode("normal");
    setSelectedIds(new Set());
  };

  const toggleSelected = (songId: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(songId)) next.delete(songId);
      else next.add(songId);
      return next;
    });
  };

  const handleReorder = async (newData: Song[]) => {
    setSongs(newData);
    try {
      const db = await dbAsync;
      for (let i = 0; i < newData.length; i++) {
        await db.runAsync(
          "UPDATE playlist_songs SET position = ? WHERE playlist_id = ? AND song_id = ?",
          [i, id, newData[i].id],
        );
      }
    } catch (error) {
      console.error("Failed to save reordered positions:", error);
    }
  };

  const handleRemoveSelected = () => {
    if (selectedIds.size === 0) return;
    Alert.alert(
      "Remove Songs",
      `Remove ${selectedIds.size} song${selectedIds.size === 1 ? "" : "s"} from this playlist?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Remove",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await dbAsync;
              const idsArray = Array.from(selectedIds);
              for (const songId of idsArray) {
                await db.runAsync(
                  "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
                  [id, songId],
                );
              }
              setSongs((prev) => prev.filter((s) => !selectedIds.has(s.id)));
              exitMode();
            } catch (error) {
              console.error("Failed to remove selected songs:", error);
            }
          },
        },
      ],
    );
  };

  const handleDeletePlaylist = () => {
    Alert.alert(
      "Delete Playlist",
      `Are you sure you want to delete "${playlistMeta?.name || title}"? This cannot be undone.`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await dbAsync;
              await db.runAsync("DELETE FROM playlists WHERE id = ?", [id]);
              router.back();
            } catch (error) {
              console.error("Failed to delete playlist:", error);
            }
          },
        },
      ],
    );
  };

  // AFTER:
  const headerBlock = useMemo(() => {
    const artwork = playlistMeta?.artwork_path
      ? { uri: playlistMeta.artwork_path }
      : placeholderIcon;

    const titleText = playlistMeta?.name || title || "Playlist";

    return (
      <View style={styles.headerContainer}>
        <View style={styles.navRow}>
          <TouchableOpacity onPress={() => router.back()} activeOpacity={0.7}>
            <Ionicons name="arrow-back" size={26} color={colors.text} />
          </TouchableOpacity>

          {mode !== "normal" ? (
            <TouchableOpacity onPress={exitMode} activeOpacity={0.7}>
              <Text style={[styles.exitModeText, { color: colors.primary }]}>
                {mode === "reorder" ? "Done" : "Cancel"}
              </Text>
            </TouchableOpacity>
          ) : isCustomPlaylist ? (
            <TouchableOpacity
              onPress={() => setIsMenuOpen(true)}
              activeOpacity={0.7}
            >
              <Ionicons
                name="ellipsis-vertical"
                size={24}
                color={colors.text}
              />
            </TouchableOpacity>
          ) : (
            <View style={{ width: 24 }} />
          )}
        </View>

        <View style={styles.artworkWrapper}>
          <Image
            source={artwork}
            style={[styles.mainCdArt, { backgroundColor: colors.surface }]}
            resizeMode="cover"
          />
        </View>

        <Text style={[styles.playlistMainTitle, { color: colors.text }]}>
          {titleText}
        </Text>
        <Text
          style={[styles.playlistDescription, { color: colors.textSecondary }]}
        >
          {mode === "select"
            ? `${selectedIds.size} selected`
            : `${songs.length} ${songs.length === 1 ? "Song" : "Songs"}`}
        </Text>
      </View>
    );
  }, [
    colors,
    mode,
    isCustomPlaylist,
    playlistMeta?.artwork_path,
    playlistMeta?.name,
    title,
    selectedIds.size,
    songs.length,
    router,
  ]);

  const renderNormalItem = useCallback(
    ({ item }: { item: Song }) => {
      return (
        <SwipeableSongRow item={item}>
          <RNGHTouchableOpacity
            activeOpacity={0.7}
            onPress={() => playSong(item, songs)}
            style={styles.songRowItem}
          >
            <Image
              source={
                item.custom_artwork_path
                  ? { uri: item.custom_artwork_path }
                  : placeholderIcon
              }
              style={[styles.songRowArt, { backgroundColor: colors.surface }]}
              resizeMode="cover"
            />
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

            {isFavoritesPlaylist && (
              <RNGHTouchableOpacity
                activeOpacity={0.7}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                onPress={async () => {
                  await toggleFavorite(item.id);
                  setSongs((prev) => prev.filter((s) => s.id !== item.id));
                }}
                style={{ paddingLeft: 12 }}
              >
                <Ionicons name="heart" size={22} color="#E94560" />
              </RNGHTouchableOpacity>
            )}
          </RNGHTouchableOpacity>
        </SwipeableSongRow>
      );
    },
    [colors, isFavoritesPlaylist, playSong, songs, toggleFavorite],
  );

  const renderSelectableItem = useCallback(
    ({ item }: { item: Song }) => {
      const isSelected = selectedIds.has(item.id);
      return (
        <RNGHTouchableOpacity
          activeOpacity={0.7}
          onPress={() => toggleSelected(item.id)}
          style={styles.songRowItem}
        >
          <Ionicons
            name={isSelected ? "checkbox" : "square-outline"}
            size={22}
            color={isSelected ? colors.primary : colors.textSecondary}
            style={styles.selectIcon}
          />
          <Image
            source={
              item.custom_artwork_path
                ? { uri: item.custom_artwork_path }
                : placeholderIcon
            }
            style={[styles.songRowArt, { backgroundColor: colors.surface }]}
            resizeMode="cover"
          />
          <View style={styles.metaTextContainer}>
            <Text
              style={[styles.songTitleLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.songArtistLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.artist || "Local Audio"}
            </Text>
          </View>
        </RNGHTouchableOpacity>
      );
    },
    [colors, selectedIds],
  );

  const renderDraggableItem = useCallback(
    ({ item, drag, isActive }: RenderItemParams<Song>) => (
      <ScaleDecorator>
        <RNGHTouchableOpacity
          activeOpacity={1}
          onLongPress={drag}
          disabled={isActive}
          style={[styles.songRowItem, { opacity: isActive ? 0.7 : 1 }]}
        >
          <Ionicons
            name="reorder-three-outline"
            size={22}
            color={colors.textSecondary}
            style={styles.selectIcon}
          />
          <Image
            source={
              item.custom_artwork_path
                ? { uri: item.custom_artwork_path }
                : placeholderIcon
            }
            style={[styles.songRowArt, { backgroundColor: colors.surface }]}
            resizeMode="cover"
          />
          <View style={styles.metaTextContainer}>
            <Text
              style={[styles.songTitleLabel, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.songArtistLabel, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.artist || "Local Audio"}
            </Text>
          </View>
        </RNGHTouchableOpacity>
      </ScaleDecorator>
    ),
    [colors],
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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {mode === "reorder" ? (
        <DraggableFlatList
          data={songs}
          keyExtractor={(item) => item.id}
          onDragEnd={({ data }) => handleReorder(data)}
          renderItem={renderDraggableItem}
          ListHeaderComponent={headerBlock}
          contentContainerStyle={styles.listPadding}
        />
      ) : (
        <FlatList
          data={songs}
          keyExtractor={(item) => item.id}
          ListHeaderComponent={headerBlock}
          contentContainerStyle={styles.listPadding}
          showsVerticalScrollIndicator={false}
          ListEmptyComponent={
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              No tracks found matching this playlist filter rules yet.
            </Text>
          }
          renderItem={
            mode === "select" ? renderSelectableItem : renderNormalItem
          }
        />
      )}

      {mode === "select" && (
        <View
          style={[
            styles.selectBar,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.selectCountText, { color: colors.textSecondary }]}
          >
            {selectedIds.size} selected
          </Text>
          <TouchableOpacity
            disabled={selectedIds.size === 0}
            onPress={handleRemoveSelected}
            style={[
              styles.removeSelectedBtn,
              {
                backgroundColor: "#E94560",
                opacity: selectedIds.size === 0 ? 0.5 : 1,
              },
            ]}
          >
            <Text style={styles.removeSelectedText}>Remove</Text>
          </TouchableOpacity>
        </View>
      )}

      <Modal
        transparent
        visible={isMenuOpen}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <TouchableOpacity
          style={styles.menuBackdrop}
          activeOpacity={1}
          onPress={() => setIsMenuOpen(false)}
        >
          <View
            style={[
              styles.menuCard,
              {
                backgroundColor: colors.surface,
                borderColor: colors.border,
                top: insets.top + 46,
              },
            ]}
          >
            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                setMode("reorder");
              }}
            >
              <Ionicons
                name="reorder-three-outline"
                size={18}
                color={colors.text}
              />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Reorder Songs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                setMode("select");
              }}
            >
              <Ionicons name="checkbox-outline" size={18} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Remove Songs
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                setIsEditModalVisible(true);
              }}
            >
              <Ionicons name="create-outline" size={18} color={colors.text} />
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Edit Playlist
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              onPress={() => {
                setIsMenuOpen(false);
                handleDeletePlaylist();
              }}
            >
              <Ionicons name="trash-outline" size={18} color="#E94560" />
              <Text style={[styles.menuItemText, { color: "#E94560" }]}>
                Delete Playlist
              </Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>

      <EditPlaylistModal
        isVisible={isEditModalVisible}
        playlist={playlistMeta}
        onClose={() => setIsEditModalVisible(false)}
        onSaved={(updated) =>
          setPlaylistMeta((prev) => (prev ? { ...prev, ...updated } : prev))
        }
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingCenter: { flex: 1, justifyContent: "center", alignItems: "center" },
  listPadding: { paddingBottom: 140 },
  headerContainer: {
    alignItems: "center",
    paddingHorizontal: 24,
    paddingTop: 48,
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
  exitModeText: { fontSize: 15, fontWeight: "700" },
  artworkWrapper: {
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.12,
    shadowRadius: 10,
    elevation: 4,
  },
  mainCdArt: { width: width * 0.56, height: width * 0.56, borderRadius: 16 },
  playlistMainTitle: {
    fontSize: 26,
    fontWeight: "700",
    textAlign: "center",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  playlistDescription: { fontSize: 14, fontWeight: "500", textAlign: "center" },
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
    paddingVertical: 10,
  },
  selectIcon: { marginRight: 14 },
  songRowArt: { width: 48, height: 48, borderRadius: 8, marginRight: 16 },
  metaTextContainer: { flex: 1, paddingRight: 8 },
  songTitleLabel: { fontSize: 15, fontWeight: "600", marginBottom: 3 },
  songArtistLabel: { fontSize: 13 },
  selectBar: {
    position: "absolute",
    bottom: 96,
    left: 16,
    right: 16,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 12,
    paddingHorizontal: 18,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  selectCountText: { fontSize: 14, fontWeight: "600" },
  removeSelectedBtn: {
    paddingVertical: 8,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  removeSelectedText: { color: "#FFFFFF", fontSize: 14, fontWeight: "700" },
  menuBackdrop: { flex: 1 },
  menuCard: {
    position: "absolute",
    right: 20,
    borderRadius: 14,
    borderWidth: 1,
    paddingVertical: 6,
    minWidth: 190,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuItemText: { fontSize: 14, fontWeight: "600", marginLeft: 10 },
});
