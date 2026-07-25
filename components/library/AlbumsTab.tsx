import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { Song } from "./SongsTab";

interface AlbumsTabProps {
  songs: Song[];
  searchQuery: string;
}

interface AlbumGroup {
  name: string;
  artist: string;
  tracks: Song[];
}

const SCREEN_WIDTH = Dimensions.get("window").width;
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function AlbumsTab({ songs, searchQuery }: AlbumsTabProps) {
  const { colors } = useTheme();
  const router = useRouter();
  const isFocused = useIsFocused();

  // Map of album name -> album_artworks path from SQLite
  const [albumArtworksMap, setAlbumArtworksMap] = useState<
    Record<string, string>
  >({});

  // Fetch all custom album covers directly from SQLite whenever screen is focused
  useEffect(() => {
    let isMounted = true;

    async function loadAlbumArtworks() {
      try {
        const db = await dbAsync;
        // Ensure table exists
        await db.execAsync(`
          CREATE TABLE IF NOT EXISTS album_artworks (
            album TEXT PRIMARY KEY,
            artwork_path TEXT
          );
        `);

        const rows = await db.getAllAsync<{
          album: string;
          artwork_path: string;
        }>("SELECT album, artwork_path FROM album_artworks");

        if (!isMounted) return;

        const map: Record<string, string> = {};
        for (const row of rows) {
          if (row.album && row.artwork_path) {
            map[row.album] = row.artwork_path;
          }
        }
        setAlbumArtworksMap(map);
      } catch (error) {
        console.error("Failed to fetch album_artworks in AlbumsTab:", error);
      }
    }

    if (isFocused) {
      loadAlbumArtworks();
    }

    return () => {
      isMounted = false;
    };
  }, [isFocused]);

  // Group songs into albums
  const albumsMap = songs.reduce<Record<string, AlbumGroup>>((acc, song) => {
    const albumKey = song.album || "Unknown Album";

    if (!acc[albumKey]) {
      acc[albumKey] = {
        name: albumKey,
        artist: song.artist || "Unknown Artist",
        tracks: [],
      };
    }

    acc[albumKey].tracks.push(song);
    return acc;
  }, {});

  const albumList: AlbumGroup[] = Object.values(albumsMap).filter(
    (a: AlbumGroup) =>
      a.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      a.artist.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  return (
    <View style={styles.container}>
      <FlatList<AlbumGroup>
        data={albumList}
        keyExtractor={(item) => item.name}
        numColumns={2}
        columnWrapperStyle={styles.columnWrapper}
        contentContainerStyle={styles.listPadding}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No albums found.
          </Text>
        }
        renderItem={({ item }) => {
          // Priority Order:
          // 1. Direct match in album_artworks table
          // 2. Fallback to song's custom_artwork_path
          const firstTrackWithArt = item.tracks.find(
            (t) => t.custom_artwork_path && t.custom_artwork_path.trim() !== "",
          );

          const coverUri =
            albumArtworksMap[item.name] ||
            firstTrackWithArt?.custom_artwork_path;

          return (
            <TouchableOpacity
              activeOpacity={0.8}
              style={[styles.albumCard, { width: CARD_WIDTH }]}
              onPress={() =>
                router.push({
                  pathname: "/album",
                  params: { name: item.name },
                })
              }
            >
              <Image
                source={
                  coverUri
                    ? { uri: `${coverUri}?t=${Date.now()}` }
                    : placeholderIcon
                }
                style={[
                  styles.albumArt,
                  {
                    width: CARD_WIDTH,
                    height: CARD_WIDTH,
                    backgroundColor: colors.surface,
                  },
                ]}
                resizeMode="cover"
              />
              <Text
                style={[styles.albumTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.name}
              </Text>
              <Text
                style={[styles.albumArtist, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.artist}
              </Text>
            </TouchableOpacity>
          );
        }}
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
  columnWrapper: {
    justifyContent: "space-between",
    marginBottom: 20,
  },
  albumCard: {},
  albumArt: {
    borderRadius: 16,
    marginBottom: 8,
  },
  albumTitle: {
    fontSize: 15,
    fontWeight: "700",
    textAlign: "center",
  },
  albumArtist: {
    fontSize: 13,
    textAlign: "center",
    marginTop: 2,
  },
  emptyText: {
    textAlign: "center",
    marginTop: 40,
    fontSize: 15,
  },
});
