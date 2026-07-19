import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { useRouter } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  Dimensions,
  FlatList,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const { width } = Dimensions.get("window");
const CARD_SIZE = (width - 52) / 2; // Mathematically fits 2 cards side-by-side with clean spacing

interface PlaylistCard {
  id: string;
  title: string;
  count: number;
  icon: keyof typeof Ionicons.glyphMap;
  colorPreset: string;
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors, theme } = useTheme();
  const isFocused = useIsFocused();
  const [smartPlaylists, setSmartPlaylists] = useState<PlaylistCard[]>([]);

  const loadSmartPlaylistMetrics = useCallback(async () => {
    try {
      const db = await dbAsync;

      const recentResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs WHERE last_played > 0",
      );
      const recentCount = recentResult?.total || 0;

      const mostPlayedResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs WHERE play_count >= 3",
      );
      const mostPlayedCount = mostPlayedResult?.total || 0;

      const leastPlayedResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs WHERE play_count < 3",
      );
      const leastPlayedCount = leastPlayedResult?.total || 0;

      const favoritesResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs WHERE is_favorite = 1",
      );
      const favoritesCount = favoritesResult?.total || 0;

      setSmartPlaylists([
        {
          id: "recent",
          title: "Recently Played",
          count: recentCount,
          icon: "time-outline",
          colorPreset: "#4E9F3D",
        },
        {
          id: "most",
          title: "Most Played",
          count: mostPlayedCount,
          icon: "flame-outline",
          colorPreset: colors.primary,
        },
        {
          id: "least",
          title: "Least Played",
          count: leastPlayedCount,
          icon: "trending-down-outline",
          colorPreset: "#1F4690",
        },
        {
          id: "favorites",
          title: "Favorites",
          count: favoritesCount,
          icon: "heart-outline",
          colorPreset: "#E94560",
        },
      ]);
    } catch (error) {
      console.error("Failed to query history metrics:", error);
    }
  }, [colors.primary]); // Tells React to only re-generate this function if your primary brand color changes

  // 2. Add 'loadSmartPlaylistMetrics' to the useEffect dependency array safely now!
  useEffect(() => {
    if (isFocused) {
      loadSmartPlaylistMetrics();
    }
  }, [isFocused, loadSmartPlaylistMetrics]);

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollPadding}
      showsVerticalScrollIndicator={false}
    >
      <View style={styles.welcomeBlock}>
        <Text style={[styles.greetingText, { color: colors.textSecondary }]}>
          {theme === "dark" ? "Good Evening 🌌" : "Good Day ☀️"}
        </Text>
        <Text style={[styles.brandHeader, { color: colors.text }]}>
          Melomu Player
        </Text>
      </View>

      <Text style={[styles.sectionHeading, { color: colors.text }]}>
        Automated Smart Playlists
      </Text>

      <FlatList
        data={smartPlaylists}
        keyExtractor={(item) => item.id}
        numColumns={2}
        scrollEnabled={false}
        columnWrapperStyle={styles.gridRowSpacing}
        renderItem={({ item }) => (
          <TouchableOpacity
            activeOpacity={0.85}
            /* Pass the unique id and playlist card title cleanly over our page query strings */
            onPress={() =>
              router.push({
                pathname: "/playlist",
                params: { id: item.id, title: item.title },
              })
            }
            style={[
              styles.playlistCard,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            <View
              style={[styles.iconBox, { backgroundColor: item.colorPreset }]}
            >
              <Ionicons name={item.icon} size={28} color="#FFFFFF" />
            </View>

            <View style={styles.cardInfo}>
              <Text
                style={[styles.cardTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {item.title}
              </Text>
              <Text style={[styles.cardCount, { color: colors.textSecondary }]}>
                {item.count} {item.count === 1 ? "Track" : "Tracks"}
              </Text>
            </View>
          </TouchableOpacity>
        )}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 140, // Ensures text lists clear the floating player cleanly
  },
  welcomeBlock: {
    marginTop: 12,
    marginBottom: 28,
  },
  greetingText: {
    fontSize: 14,
    fontWeight: "500",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  brandHeader: {
    fontSize: 28,
    fontWeight: "800",
    marginTop: 4,
  },
  sectionHeading: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
    letterSpacing: 0.2,
  },
  gridRowSpacing: {
    justifyContent: "space-between",
    marginBottom: 16,
  },
  playlistCard: {
    width: CARD_SIZE,
    borderRadius: 18,
    padding: 12,
    borderWidth: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  iconBox: {
    width: "100%",
    height: CARD_SIZE - 56, // Calculates safe squared box sizing proportions fluidly
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 12,
  },
  cardInfo: {
    paddingHorizontal: 2,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: "600",
    marginBottom: 2,
  },
  cardCount: {
    fontSize: 12,
    fontWeight: "500",
  },
});
