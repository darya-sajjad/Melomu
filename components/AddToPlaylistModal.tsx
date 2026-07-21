import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useState } from "react";
import {
    FlatList,
    Image,
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface Song {
  id: string;
  title: string;
}

interface PlaylistRow {
  id: string;
  name: string;
  artwork_path: string | null;
  isAdded: number;
}

interface AddToPlaylistModalProps {
  isVisible: boolean;
  song: Song | null;
  onClose: () => void;
}

export default function AddToPlaylistModal({
  isVisible,
  song,
  onClose,
}: AddToPlaylistModalProps) {
  const { colors } = useTheme();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);

  const loadPlaylistsForSong = useCallback(async () => {
    if (!song) return;
    try {
      const db = await dbAsync;
      const results = await db.getAllAsync<PlaylistRow>(
        `SELECT p.id, p.name, p.artwork_path,
                CASE WHEN ps.song_id IS NOT NULL THEN 1 ELSE 0 END as isAdded
         FROM playlists p
         LEFT JOIN playlist_songs ps ON ps.playlist_id = p.id AND ps.song_id = ?
         ORDER BY p.created_at DESC`,
        [song.id],
      );
      setPlaylists(results);
    } catch (error) {
      console.error("Failed to load playlists for song:", error);
    }
  }, [song]);

  useEffect(() => {
    if (isVisible && song) {
      loadPlaylistsForSong();
    }
  }, [isVisible, song, loadPlaylistsForSong]);

  const toggleSongInPlaylist = async (
    playlistId: string,
    isCurrentlyAdded: boolean,
  ) => {
    if (!song) return;
    try {
      const db = await dbAsync;

      if (isCurrentlyAdded) {
        await db.runAsync(
          "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
          [playlistId, song.id],
        );
      } else {
        const countResult: any = await db.getFirstAsync(
          "SELECT COUNT(*) as total FROM playlist_songs WHERE playlist_id = ?",
          [playlistId],
        );
        const nextPosition = countResult?.total || 0;
        await db.runAsync(
          "INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
          [playlistId, song.id, nextPosition],
        );
      }

      loadPlaylistsForSong();
    } catch (error) {
      console.error("Failed to toggle song in playlist:", error);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View
          style={[
            styles.modalBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text
            style={[styles.modalTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            Add &quot;{song?.title}&quot; to...
          </Text>

          <FlatList
            data={playlists}
            keyExtractor={(item) => item.id}
            style={{ maxHeight: 360 }}
            ListEmptyComponent={
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                You don&apos;t have any playlists yet. Create one from the Home
                tab first.
              </Text>
            }
            renderItem={({ item }) => (
              <TouchableOpacity
                activeOpacity={0.7}
                style={styles.playlistRow}
                onPress={() => toggleSongInPlaylist(item.id, !!item.isAdded)}
              >
                <Image
                  source={
                    item.artwork_path
                      ? { uri: item.artwork_path }
                      : placeholderIcon
                  }
                  style={styles.rowArt}
                />
                <Text
                  style={[styles.rowName, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.name}
                </Text>
                <Ionicons
                  name={
                    item.isAdded ? "checkmark-circle" : "add-circle-outline"
                  }
                  size={24}
                  color={item.isAdded ? colors.primary : colors.textSecondary}
                />
              </TouchableOpacity>
            )}
          />

          <TouchableOpacity
            onPress={onClose}
            style={[styles.doneBtn, { backgroundColor: colors.primary }]}
          >
            <Text style={styles.doneText}>Done</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: { fontSize: 18, fontWeight: "700", marginBottom: 16 },
  emptyText: { textAlign: "center", paddingVertical: 20, fontSize: 14 },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
  },
  rowArt: { width: 42, height: 42, borderRadius: 8, marginRight: 14 },
  rowName: { flex: 1, fontSize: 15, fontWeight: "600" },
  doneBtn: {
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    marginTop: 16,
  },
  doneText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
