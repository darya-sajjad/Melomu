import AlbumsTab from "@/components/AlbumsTab";
import ArtistsTab from "@/components/ArtistsTab";
import SongsTab, { Song } from "@/components/SongsTab";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

type CategoryTab = "songs" | "albums" | "artists";

export default function LibraryScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();

  const [songs, setSongs] = useState<Song[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [activeTab, setActiveTab] = useState<CategoryTab>("songs");

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
      {/* 1. Top Section: Search Bar floating over root background */}
      <View style={styles.topSection}>
        <View
          style={[
            styles.searchBarContainer,
            { backgroundColor: "#FFFFFF", borderColor: "transparent" },
          ]}
        >
          <TextInput
            placeholder="Search..."
            placeholderTextColor="#8E8E93"
            value={searchQuery}
            onChangeText={setSearchQuery}
            style={styles.searchInput}
          />
          <Ionicons name="search" size={20} color="#000000" />
        </View>
      </View>

      {/* 2. Curved Main Sheet Container containing Tabs + Lists */}
      <View
        style={[
          styles.curvedSheet,
          {
            backgroundColor: colors.background,
            borderColor: colors.background,
          },
        ]}
      >
        {/* Category Filter Pills Row */}
        <View style={styles.tabBar}>
          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabPill,
              activeTab === "songs"
                ? { backgroundColor: "#B2EBF2" } // Active Pill Color matching Figma
                : { backgroundColor: colors.background },
            ]}
            onPress={() => setActiveTab("songs")}
          >
            <Text
              style={[
                styles.tabPillText,
                {
                  color: activeTab === "songs" ? "#000000" : colors.text,
                },
              ]}
            >
              Songs
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabPill,
              activeTab === "albums"
                ? { backgroundColor: "#B2EBF2" }
                : { backgroundColor: colors.background },
            ]}
            onPress={() => setActiveTab("albums")}
          >
            <Text
              style={[
                styles.tabPillText,
                {
                  color: activeTab === "albums" ? "#000000" : colors.text,
                },
              ]}
            >
              Albums
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            activeOpacity={0.8}
            style={[
              styles.tabPill,
              activeTab === "artists"
                ? { backgroundColor: "#B2EBF2" }
                : { backgroundColor: colors.background },
            ]}
            onPress={() => setActiveTab("artists")}
          >
            <Text
              style={[
                styles.tabPillText,
                {
                  color: activeTab === "artists" ? "#000000" : colors.text,
                },
              ]}
            >
              Artists
            </Text>
          </TouchableOpacity>
        </View>

        {/* Dynamic Tab Content Views */}
        <View style={{ flex: 1 }}>
          {activeTab === "songs" && (
            <SongsTab
              songs={songs}
              searchQuery={searchQuery}
              onRefreshDatabase={fetchSongsFromDatabase}
            />
          )}

          {activeTab === "albums" && (
            <AlbumsTab songs={songs} searchQuery={searchQuery} />
          )}

          {activeTab === "artists" && (
            <ArtistsTab songs={songs} searchQuery={searchQuery} />
          )}
        </View>
      </View>
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
  topSection: {
    paddingHorizontal: 16,
    paddingBottom: 16,
  },
  searchBarContainer: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 18,
    paddingVertical: Platform.OS === "ios" ? 12 : 8,
    borderRadius: 24,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    color: "#000000",
  },
  curvedSheet: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    paddingTop: 20,
    paddingBottom: 50,
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
    marginHorizontal: 12,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
});
