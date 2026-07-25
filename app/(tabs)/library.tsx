import AddToPlaylistModal from "@/components/AddToPlaylistModal";
import AlbumsTab from "@/components/library/AlbumsTab";
import ArtistsTab from "@/components/library/ArtistsTab";
import BatchEditModal from "@/components/library/BatchEditModal";
import { LibraryTopSection } from "@/components/library/LibraryTopSection";
import SongsTab, { Song } from "@/components/library/SongsTab";
import { dbAsync } from "@/constants/Database";
import { useSelectionMode } from "@/constants/Selectionmodecontext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

type CategoryTab = "songs" | "albums" | "artists";

const CATEGORY_TABS: { key: CategoryTab; label: string }[] = [
  { key: "songs", label: "Songs" },
  { key: "albums", label: "Albums" },
  { key: "artists", label: "Artists" },
];

export default function LibraryScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const { setIsSelectionModeActive } = useSelectionMode();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("songs");

  // Multi-select State
  const [isSelectMode, setIsSelectMode] = useState(false);
  const [selectedSongIds, setSelectedSongIds] = useState<string[]>([]);
  const [batchEditType, setBatchEditType] = useState<"album" | "artist" | null>(
    null,
  );
  const [isPlaylistModalVisible, setIsPlaylistModalVisible] = useState(false);
  const [isBatchEditModalVisible, setIsBatchEditModalVisible] = useState(false);

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

  // Enter selection mode helper
  const enterSelectMode = (type: "album" | "artist" | null = null) => {
    setActiveTab("songs");
    setIsSelectMode(true);
    setBatchEditType(type);
    setIsSelectionModeActive(true); // Drops TabBar & MiniPlayer
  };

  // Exit selection mode helper (Guarantees TabBar returns)
  const exitSelectMode = () => {
    setIsSelectMode(false);
    setSelectedSongIds([]);
    setBatchEditType(null);
    setIsBatchEditModalVisible(false);
    setIsSelectionModeActive(false); // Brings TabBar back!
  };

  // Handle individual song check toggles
  const handleToggleSelectSong = (id: string) => {
    setSelectedSongIds((prev) =>
      prev.includes(id) ? prev.filter((sId) => sId !== id) : [...prev, id],
    );
  };

  const handleSelectAll = () => {
    if (selectedSongIds.length === songs.length) {
      setSelectedSongIds([]);
    } else {
      setSelectedSongIds(songs.map((s) => s.id));
    }
  };

  // 1. Batch Delete Function
  const handleExecuteBatchDelete = () => {
    if (selectedSongIds.length === 0) return;

    Alert.alert(
      "Delete Selected Songs",
      `Are you sure you want to delete ${selectedSongIds.length} song(s)?`,
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Delete",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await dbAsync;
              const placeholders = selectedSongIds.map(() => "?").join(",");
              await db.runAsync(
                `DELETE FROM songs WHERE id IN (${placeholders})`,
                selectedSongIds,
              );
              exitSelectMode();
              fetchSongsFromDatabase();
            } catch (error) {
              console.error("Failed batch delete:", error);
            }
          },
        },
      ],
    );
  };

  // 2. Batch Metadata Save (Album / Artist)
  const handleExecuteBatchUpdate = async (newValue: string) => {
    if (selectedSongIds.length === 0 || !batchEditType) return;

    try {
      const db = await dbAsync;
      const field = batchEditType === "album" ? "album" : "artist";
      const placeholders = selectedSongIds.map(() => "?").join(",");
      await db.runAsync(
        `UPDATE songs SET ${field} = ? WHERE id IN (${placeholders})`,
        [newValue, ...selectedSongIds],
      );

      if (batchEditType === "album") {
        const albumArt = await db.getFirstAsync<{ artwork_path: string }>(
          "SELECT artwork_path FROM album_artworks WHERE album = ?",
          [newValue],
        );
        if (albumArt?.artwork_path) {
          await db.runAsync(
            `UPDATE songs SET custom_artwork_path = ? WHERE id IN (${placeholders}) AND (custom_artwork_path IS NULL OR custom_artwork_path = '')`,
            [albumArt.artwork_path, ...selectedSongIds],
          );
        }
      }

      exitSelectMode();
      fetchSongsFromDatabase();
    } catch (error) {
      console.error(`Failed batch ${batchEditType} update:`, error);
    }
  };

  // Selected Song Objects for Playlist Modal
  const selectedSongObjects = songs.filter((s) =>
    selectedSongIds.includes(s.id),
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
    <View style={[styles.container, { backgroundColor: "#1E1E1E" }]}>
      {/* Search Header */}
      <LibraryTopSection
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        onSelectMultipleToDelete={() => enterSelectMode(null)}
        onSelectMultipleToEditAlbum={() => enterSelectMode("album")}
        onSelectMultipleToEditArtist={() => enterSelectMode("artist")}
      />

      {/* Main Sheet */}
      <View
        style={[
          styles.curvedSheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.background,
          },
        ]}
      >
        {/* Category Pills Row */}
        <View style={styles.tabBar}>
          {CATEGORY_TABS.map((tab) => {
            const isActive = activeTab === tab.key;
            return (
              <TouchableOpacity
                key={tab.key}
                activeOpacity={0.8}
                style={[
                  styles.tabPill,
                  {
                    backgroundColor: isActive
                      ? colors.primary || "#B2EBF2"
                      : colors.background,
                  },
                ]}
                onPress={() => {
                  if (isSelectMode) exitSelectMode();
                  setActiveTab(tab.key);
                }}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    { color: isActive ? "#000000" : colors.text },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Tab Content */}
        <View style={styles.tabContent}>
          {activeTab === "songs" && (
            <SongsTab
              songs={songs}
              searchQuery={searchQuery}
              onRefreshDatabase={fetchSongsFromDatabase}
              isSelectMode={isSelectMode}
              selectedSongIds={selectedSongIds}
              onToggleSelectSong={handleToggleSelectSong}
            />
          )}

          {activeTab === "albums" && (
            <AlbumsTab songs={songs} searchQuery={searchQuery} />
          )}

          {activeTab === "artists" && (
            <ArtistsTab songs={songs} searchQuery={searchQuery} />
          )}
        </View>

        {/* Floating Action Bar (Appears when in select mode) */}
        {isSelectMode && (
          <View
            style={[
              styles.actionBar,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <TouchableOpacity onPress={exitSelectMode} style={styles.actionBtn}>
              <Ionicons name="close" size={20} color={colors.text} />
              <Text style={[styles.actionText, { color: colors.text }]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity onPress={handleSelectAll}>
              <Text style={[styles.countText, { color: colors.primary }]}>
                {selectedSongIds.length === songs.length
                  ? "Deselect"
                  : "Select All"}{" "}
                ({selectedSongIds.length})
              </Text>
            </TouchableOpacity>

            <View style={styles.rightActions}>
              {/* Add to Playlist button */}
              {!batchEditType && selectedSongIds.length > 0 && (
                <TouchableOpacity
                  onPress={() => setIsPlaylistModalVisible(true)}
                  style={styles.actionBtn}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={colors.primary}
                  />
                </TouchableOpacity>
              )}

              {/* Apply Edit or Delete button */}
              <TouchableOpacity
                disabled={selectedSongIds.length === 0}
                onPress={() => {
                  if (batchEditType) {
                    setIsBatchEditModalVisible(true);
                  } else {
                    handleExecuteBatchDelete();
                  }
                }}
                style={[
                  styles.actionBtn,
                  { opacity: selectedSongIds.length > 0 ? 1 : 0.4 },
                ]}
              >
                <Text
                  style={[
                    styles.actionText,
                    {
                      color: batchEditType
                        ? colors.primary
                        : colors.notification || "#FF5252",
                    },
                  ]}
                >
                  {batchEditType ? "Apply" : "Delete"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </View>

      <BatchEditModal
        visible={isBatchEditModalVisible}
        type={batchEditType}
        count={selectedSongIds.length}
        onClose={() => setIsBatchEditModalVisible(false)}
        onSubmit={handleExecuteBatchUpdate}
      />

      {/* Bulk Add to Playlist Modal */}
      <AddToPlaylistModal
        isVisible={isPlaylistModalVisible}
        songs={selectedSongObjects}
        onClose={() => {
          setIsPlaylistModalVisible(false);
          exitSelectMode();
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 70 : 30,
  },
  loadingCenter: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  curvedSheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingBottom: 0,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  tabBar: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    marginBottom: 16,
  },
  tabPill: {
    paddingHorizontal: 25,
    paddingVertical: 10,
    borderRadius: 20,
    alignItems: "center",
    marginHorizontal: 4,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
  },
  actionBar: {
    position: "absolute",
    bottom: Platform.OS === "ios" ? 35 : 75,
    left: 20,
    right: 20,
    height: 56,
    borderRadius: 28,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 18,
    elevation: 10,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    zIndex: 99,
  },
  actionBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 4,
  },
  rightActions: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  actionText: {
    fontSize: 15,
    fontWeight: "600",
  },
  countText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
