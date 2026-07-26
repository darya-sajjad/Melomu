import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Song } from "../library/SongsTab";

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listPadding: {
    paddingHorizontal: 16,
    paddingBottom: 100,
  },
  artistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
  },
  circleAvatar: {
    width: 46,
    height: 46,
    borderRadius: 23,
    marginRight: 16,
  },
  artistName: {
    flex: 1,
    fontSize: 16,
    fontWeight: "600",
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});

interface ArtistsTabProps {
  songs: Song[];
  searchQuery: string;
}

interface ArtistItem {
  name: string;
  avatar?: string | null;
  tracks: Song[];
}

export default function ArtistsTab({ songs, searchQuery }: ArtistsTabProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const [artistAvatars, setArtistAvatars] = useState<Record<string, string>>(
    {},
  );

  useEffect(() => {
    const fetchArtistAvatars = async () => {
      try {
        const db = await dbAsync;
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS artist_artworks (
            artist TEXT PRIMARY KEY,
            artwork_path TEXT
          );
        `);
        const rows = await db.getAllAsync<{
          artist: string;
          artwork_path: string;
        }>("SELECT artist, artwork_path FROM artist_artworks");
        const map: Record<string, string> = {};
        rows.forEach((row) => {
          map[row.artist] = row.artwork_path;
        });
        setArtistAvatars(map);
      } catch (e) {
        console.error("Failed to fetch artist avatars:", e);
      }
    };

    fetchArtistAvatars();
  }, [songs]);

  const artistsMap = songs.reduce(
    (acc, song) => {
      const artistKey = song.artist || "Unknown Artist";
      if (!acc[artistKey]) {
        acc[artistKey] = {
          name: artistKey,
          avatar: artistAvatars[artistKey] || song.custom_artwork_path,
          tracks: [],
        };
      }
      acc[artistKey].tracks.push(song);
      return acc;
    },
    {} as Record<string, ArtistItem>,
  );

  const artistList = Object.values(artistsMap).filter((a) =>
    a.name.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  const renderArtistItem = useCallback(
    ({ item }: { item: ArtistItem }) => (
      <TouchableOpacity
        activeOpacity={0.7}
        style={[styles.artistRow, { borderBottomColor: colors.primary }]}
        onPress={() =>
          router.push({
            pathname: "/artist",
            params: { name: item.name },
          })
        }
      >
        <Image
          source={item.avatar ? { uri: item.avatar } : placeholderIcon}
          style={styles.circleAvatar}
        />
        <Text style={[styles.artistName, { color: colors.text }]}>
          {item.name}
        </Text>
        <Ionicons name="chevron-forward" size={20} color={colors.primary} />
      </TouchableOpacity>
    ),
    [colors.primary, colors.text, router],
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={artistList}
        keyExtractor={(item) => item.name}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No artists found.
          </Text>
        }
        renderItem={renderArtistItem}
      />
    </View>
  );
}
