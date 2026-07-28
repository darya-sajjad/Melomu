import favoritesCover from "@/assets/fav.png";
import placeholderIcon from "@/assets/icon.png";
import leastCover from "@/assets/least.png";
import mostCover from "@/assets/most.png";
import recentCover from "@/assets/recent.png";
import CreatePlaylistModal from "@/components/Home/CreatePlaylistModal";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import * as FileSystem from "expo-file-system/legacy";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  Image,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width: SCREEN_WIDTH } = Dimensions.get("window");
const GRID_PADDING = 20;
const GRID_GAP = 12;
const ITEM_WIDTH = (SCREEN_WIDTH - GRID_PADDING * 2 - GRID_GAP) / 2;
interface SmartPlaylistCard {
  id: string;
  title: string;
  subtitle: string;
  cover: any;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const [smartPlaylists, setSmartPlaylists] = useState<SmartPlaylistCard[]>([]);

  const loadSmartPlaylistMetrics = useCallback(async () => {
    try {
      setSmartPlaylists([
        {
          id: "recent",
          title: "Recently Played",
          subtitle: "Daisy",
          cover: recentCover,
        },
        {
          id: "favorites",
          title: "Favourites",
          subtitle: "Daisy",
          cover: favoritesCover,
        },
        {
          id: "most",
          title: "Most Played",
          subtitle: "Daisy",
          cover: mostCover,
        },
        {
          id: "least",
          title: "Least Played",
          subtitle: "Daisy",
          cover: leastCover,
        },
      ]);
    } catch (error) {
      console.error("Failed to set metrics:", error);
    }
  }, []);

  const [customPlaylists, setCustomPlaylists] = useState<any[]>([]);
  const [isCreateModalVisible, setCreateModalVisible] = useState(false);

  const loadCustomPlaylists = useCallback(async () => {
    try {
      const db = await dbAsync;
      const results = await db.getAllAsync<any>(`
        SELECT p.id, p.name, p.artwork_path,
               (SELECT COUNT(*) FROM playlist_songs ps WHERE ps.playlist_id = p.id) as count
        FROM playlists p
        ORDER BY p.created_at DESC
      `);
      setCustomPlaylists(results);
    } catch (error) {
      console.error("Failed to load custom playlists:", error);
    }
  }, []);

  useEffect(() => {
    if (isFocused) {
      loadSmartPlaylistMetrics();
      loadCustomPlaylists();
    }
  }, [isFocused, loadSmartPlaylistMetrics, loadCustomPlaylists]);

  useEffect(() => {
    const checkOnboarding = async () => {
      try {
        const info = await FileSystem.getInfoAsync(
          FileSystem.documentDirectory + "onboarding_complete.json",
        );
        if (!info.exists) {
          router.replace("./onboarding");
        }
      } catch (e) {
        console.error("Onboarding check failed:", e);
      }
    };
    checkOnboarding();
  }, [router]);

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <TouchableOpacity
        activeOpacity={0.7}
        style={styles.newPlaylistBtn}
        onPress={() => setCreateModalVisible(true)}
      >
        <Ionicons name="add-circle-outline" size={34} color={colors.primary} />
        <Text style={[styles.newPlaylistText, { color: colors.text }]}>
          New Playlist
        </Text>
      </TouchableOpacity>

      <ScrollView
        style={styles.scrollContainer}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridContainer}>
          {smartPlaylists.map((item, index) => (
            <TouchableOpacity
              key={item.id}
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/playlist",
                  params: { id: item.id, title: item.title },
                })
              }
              style={[
                styles.gridItem,
                index % 2 === 0 && { marginRight: GRID_GAP },
              ]}
            >
              <Image
                source={item.cover}
                style={styles.gridImage}
                resizeMode="cover"
              />
              <Text
                style={[styles.gridSubtitle, { color: colors.textSecondary }]}
                numberOfLines={1}
              >
                {item.subtitle}
              </Text>
              <Text
                style={[styles.gridTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {customPlaylists.length > 0 && (
          <View
            style={[
              styles.thickDivider,
              { backgroundColor: colors.border, marginTop: 14 },
            ]}
          />
        )}

        {customPlaylists.length > 0 &&
          customPlaylists.map((item, index) => (
            <React.Fragment key={item.id}>
              <TouchableOpacity
                activeOpacity={0.75}
                onPress={() =>
                  router.push({
                    pathname: "/playlist",
                    params: { id: item.id, title: item.name },
                  })
                }
                style={styles.playlistRow}
              >
                <Image
                  source={
                    item.artwork_path
                      ? { uri: item.artwork_path }
                      : placeholderIcon
                  }
                  style={styles.artworkContainer}
                  resizeMode="cover"
                />

                <View style={styles.metaContainer}>
                  <Text
                    style={[styles.rowTitle, { color: colors.text }]}
                    numberOfLines={1}
                  >
                    {item.name}
                  </Text>
                  <Text
                    style={[
                      styles.rowSubtitle,
                      { color: colors.textSecondary },
                    ]}
                    numberOfLines={1}
                  >
                    {item.count} {item.count === 1 ? "Track" : "Tracks"}
                  </Text>
                </View>
              </TouchableOpacity>
              {index < customPlaylists.length - 1 && (
                <View
                  style={[
                    styles.thinDivider,
                    { backgroundColor: colors.border },
                  ]}
                />
              )}
            </React.Fragment>
          ))}
      </ScrollView>

      <CreatePlaylistModal
        isVisible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => {
          setCreateModalVisible(false);
          loadCustomPlaylists();
        }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContainer: {
    flex: 1,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140,
  },
  newPlaylistBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    marginTop: 10,
    marginHorizontal: 20,
  },
  newPlaylistText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  gridContainer: {
    flexDirection: "row",
    flexWrap: "wrap",
  },
  gridItem: {
    width: ITEM_WIDTH,
    marginBottom: 16,
  },
  gridImage: {
    width: ITEM_WIDTH,
    height: ITEM_WIDTH,
    borderRadius: 8,
    marginBottom: 6,
  },
  gridTitle: {
    fontSize: 16,
    fontWeight: "700",
  },
  gridSubtitle: {
    fontSize: 13,
    fontWeight: "500",
    marginBottom: 2,
  },
  thickDivider: {
    width: "100%",
    height: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.8,
  },
  thinDivider: {
    width: "100%",
    height: 1,
    alignSelf: "center",
    marginVertical: 12,
    opacity: 0.4,
  },
  playlistRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 2,
  },
  artworkContainer: {
    width: 64,
    height: 64,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
  },
  metaContainer: {
    flex: 1,
    marginLeft: 16,
    justifyContent: "center",
  },
  rowTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  rowSubtitle: {
    fontSize: 13,
    fontWeight: "500",
  },
});
