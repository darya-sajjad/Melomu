import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useCallback, useEffect, useMemo, useState } from "react";
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
  isAdded: boolean;
}

interface AddToPlaylistModalProps {
  isVisible: boolean;
  song?: Song | null;
  songs?: Song[];
  onClose: () => void;
}

export default function AddToPlaylistModal({
  isVisible,
  song,
  songs,
  onClose,
}: AddToPlaylistModalProps) {
  const { colors } = useTheme();
  const [playlists, setPlaylists] = useState<PlaylistRow[]>([]);

  // Resolve target songs array (bulk list or single item)
  const targetSongs = useMemo(() => {
    return songs && songs.length > 0 ? songs : song ? [song] : [];
  }, [songs, song]);

  const loadPlaylistsForSongs = useCallback(async () => {
    if (targetSongs.length === 0) return;
    try {
      const db = await dbAsync;
      const allPlaylists = await db.getAllAsync<{
        id: string;
        name: string;
        artwork_path: string | null;
      }>(
        `SELECT id, name, artwork_path FROM playlists ORDER BY created_at DESC`,
      );

      const songIds = targetSongs.map((s) => s.id);
      const placeholders = songIds.map(() => "?").join(",");

      // Query which playlists contain ALL targeted songs
      const rows = await db.getAllAsync<{ playlist_id: string; count: number }>(
        `SELECT playlist_id, COUNT(DISTINCT song_id) as count 
         FROM playlist_songs 
         WHERE song_id IN (${placeholders}) 
         GROUP BY playlist_id`,
        songIds,
      );

      const countMap = new Map(rows.map((r) => [r.playlist_id, r.count]));

      const mappedPlaylists: PlaylistRow[] = allPlaylists.map((p) => {
        const matchingCount = countMap.get(p.id) || 0;
        return {
          ...p,
          // Marked as added if all targeted songs exist in this playlist
          isAdded: matchingCount >= targetSongs.length,
        };
      });

      setPlaylists(mappedPlaylists);
    } catch (error) {
      console.error("Failed to load playlists for songs:", error);
    }
  }, [targetSongs]);

  useEffect(() => {
    if (isVisible && targetSongs.length > 0) {
      loadPlaylistsForSongs();
    }
  }, [isVisible, targetSongs.length, loadPlaylistsForSongs]);

  const toggleSongsInPlaylist = useCallback(
    async (playlistId: string, isCurrentlyAdded: boolean) => {
      if (targetSongs.length === 0) return;
      try {
        const db = await dbAsync;

        await db.withTransactionAsync(async () => {
          if (isCurrentlyAdded) {
            for (const item of targetSongs) {
              await db.runAsync(
                "DELETE FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
                [playlistId, item.id],
              );
            }
          } else {
            const countResult: any = await db.getFirstAsync(
              "SELECT COUNT(*) as total FROM playlist_songs WHERE playlist_id = ?",
              [playlistId],
            );
            let currentPos = countResult?.total || 0;

            for (const item of targetSongs) {
              const existing = await db.getFirstAsync(
                "SELECT song_id FROM playlist_songs WHERE playlist_id = ? AND song_id = ?",
                [playlistId, item.id],
              );

              if (!existing) {
                await db.runAsync(
                  "INSERT INTO playlist_songs (playlist_id, song_id, position) VALUES (?, ?, ?)",
                  [playlistId, item.id, currentPos],
                );
                currentPos++;
              }
            }
          }
        });

        loadPlaylistsForSongs();
      } catch (error) {
        console.error("Failed to toggle songs in playlist:", error);
      }
    },
    [targetSongs, loadPlaylistsForSongs],
  );

  const renderPlaylistItem = useCallback(
    ({ item }: { item: PlaylistRow }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.playlistRow}
        onPress={() => toggleSongsInPlaylist(item.id, item.isAdded)}
      >
        <Image
          source={
            item.artwork_path ? { uri: item.artwork_path } : placeholderIcon
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
          name={item.isAdded ? "checkmark-circle" : "add-circle-outline"}
          size={24}
          color={item.isAdded ? colors.primary : colors.textSecondary}
        />
      </TouchableOpacity>
    ),
    [colors.primary, colors.text, colors.textSecondary, toggleSongsInPlaylist],
  );

  const modalTitleText =
    targetSongs.length > 1
      ? `Add ${targetSongs.length} tracks to...`
      : targetSongs[0]
        ? `Add "${targetSongs[0].title}" to...`
        : "Add to Playlist";

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
            {modalTitleText}
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
            renderItem={renderPlaylistItem}
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
