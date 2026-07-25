import placeholderIcon from "@/assets/icon.png";
import { useTheme } from "@/constants/ThemeContext";
import { useRouter } from "expo-router";
import React from "react";
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
  artwork?: string | null;
  tracks: Song[];
}

const SCREEN_WIDTH = Dimensions.get("window").width;
// Padding (16*2 = 32) + Gap between cards (16) = 48
const CARD_WIDTH = (SCREEN_WIDTH - 48) / 2;

export default function AlbumsTab({ songs, searchQuery }: AlbumsTabProps) {
  const { colors } = useTheme();
  const router = useRouter();

  // Dynamically group songs by Album name with explicit typing
  const albumsMap = songs.reduce<Record<string, AlbumGroup>>((acc, song) => {
    const albumKey = song.album || "Unknown Album";
    if (!acc[albumKey]) {
      acc[albumKey] = {
        name: albumKey,
        artist: song.artist || "Unknown Artist",
        artwork: song.custom_artwork_path,
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
          const firstTrackWithCover = item.tracks.find(
            (t: Song) => t.custom_artwork_path,
          );
          const coverUri =
            firstTrackWithCover?.custom_artwork_path || item.artwork;

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
                source={coverUri ? { uri: coverUri } : placeholderIcon}
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
  albumCard: {
    // Width applied dynamically inline via CARD_WIDTH
  },
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
