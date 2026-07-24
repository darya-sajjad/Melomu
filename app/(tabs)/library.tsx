import AlbumsTab from "@/components/library/AlbumsTab";
import ArtistsTab from "@/components/library/ArtistsTab";
import { SearchDock } from "@/components/library/LibraryTopSection";
import SongsTab, { Song } from "@/components/library/SongsTab";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { useIsFocused } from "@react-navigation/native";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
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
      {/* 1. Top Section: Search Dock */}
      <SearchDock searchQuery={searchQuery} setSearchQuery={setSearchQuery} />

      {/* 2. Curved Main Content Sheet */}
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
                onPress={() => setActiveTab(tab.key)}
              >
                <Text
                  style={[
                    styles.tabPillText,
                    {
                      color: isActive ? "#000000" : colors.text,
                    },
                  ]}
                >
                  {tab.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Dynamic Tab Content */}
        <View style={styles.tabContent}>
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
    marginHorizontal: 4,
  },
  tabPillText: {
    fontSize: 14,
    fontWeight: "700",
  },
  tabContent: {
    flex: 1,
  },
});
