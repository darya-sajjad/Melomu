import placeholderIcon from "@/assets/icon.png";
import CreatePlaylistModal from "@/components/CreatePlaylistModal";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  FlatList,
  Image,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

interface SmartPlaylistCard {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  colorPreset: string;
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
          icon: "time-outline",
          colorPreset: "#4E9F3D",
        },
        {
          id: "favorites",
          title: "Favourites",
          subtitle: "Daisy",
          icon: "heart-outline",
          colorPreset: "#E94560",
        },
        {
          id: "most",
          title: "Most Played",
          subtitle: "Daisy",
          icon: "flame-outline",
          colorPreset: colors.primary,
        },
        {
          id: "least",
          title: "Least Played",
          subtitle: "Daisy",
          icon: "trending-down-outline",
          colorPreset: "#1F4690",
        },
      ]);
    } catch (error) {
      console.error("Failed to set metrics:", error);
    }
  }, [colors.primary]);

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

  return (
    <>
      <ScrollView
        style={[styles.container, { backgroundColor: colors.background }]}
        contentContainerStyle={styles.scrollPadding}
        showsVerticalScrollIndicator={false}
      >
        {/* Top Header Action */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.newPlaylistBtn}
          onPress={() => setCreateModalVisible(true)}
        >
          <Ionicons name="add-circle-outline" size={24} color={colors.text} />
          <Text style={[styles.newPlaylistText, { color: colors.text }]}>
            New Playlist
          </Text>
        </TouchableOpacity>

        {/* 1. Full-width Thicker Divider after New Playlist Button */}
        <View
          style={[styles.thickDivider, { backgroundColor: colors.border }]}
        />

        {/* Smart Playlists List */}
        <FlatList
          data={smartPlaylists}
          keyExtractor={(item) => item.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => (
            /* 3. 80% Wide Thinner Line between items */
            <View
              style={[styles.thinDivider, { backgroundColor: colors.border }]}
            />
          )}
          renderItem={({ item }) => (
            <TouchableOpacity
              activeOpacity={0.75}
              onPress={() =>
                router.push({
                  pathname: "/playlist",
                  params: { id: item.id, title: item.title },
                })
              }
              style={styles.playlistRow}
            >
              <View
                style={[
                  styles.artworkContainer,
                  { backgroundColor: item.colorPreset },
                ]}
              >
                <Ionicons name={item.icon} size={30} color="#FFFFFF" />
              </View>

              <View style={styles.metaContainer}>
                <Text
                  style={[styles.rowTitle, { color: colors.text }]}
                  numberOfLines={1}
                >
                  {item.title}
                </Text>
                <Text
                  style={[styles.rowSubtitle, { color: colors.textSecondary }]}
                  numberOfLines={1}
                >
                  {item.subtitle}
                </Text>
              </View>
            </TouchableOpacity>
          )}
        />

        {/* 2. Full-width Thicker Divider below Smart Playlists */}
        {customPlaylists.length > 0 && (
          <View
            style={[
              styles.thickDivider,
              { backgroundColor: colors.border, marginTop: 14 },
            ]}
          />
        )}

        {/* Custom Playlists List */}
        {customPlaylists.length > 0 && (
          <FlatList
            data={customPlaylists}
            keyExtractor={(item) => item.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => (
              /* 80% Wide Thinner Line between custom items */
              <View
                style={[styles.thinDivider, { backgroundColor: colors.border }]}
              />
            )}
            renderItem={({ item }) => (
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
            )}
          />
        )}
      </ScrollView>

      <CreatePlaylistModal
        isVisible={isCreateModalVisible}
        onClose={() => setCreateModalVisible(false)}
        onCreated={() => {
          setCreateModalVisible(false);
          loadCustomPlaylists();
        }}
      />
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  scrollPadding: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 140,
  },
  newPlaylistBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    marginTop: 8,
  },
  newPlaylistText: {
    fontSize: 18,
    fontWeight: "600",
    marginLeft: 10,
  },
  /* 100% Width Thicker Divider */
  thickDivider: {
    width: "120%",
    height: 2,
    alignSelf: "center",
    marginBottom: 16,
    opacity: 0.8,
  },
  /* 80% Width Thinner Inset Divider */
  thinDivider: {
    width: "98%",
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
