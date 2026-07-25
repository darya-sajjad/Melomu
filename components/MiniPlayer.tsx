import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import {
  TAB_BAR_HEIGHT,
  useSelectionMode,
} from "@/constants/Selectionmodecontext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
  Animated,
  Image,
  Platform,
  StyleSheet,
  TouchableOpacity,
  View,
} from "react-native";
import TextTicker from "react-native-text-ticker";

export default function MiniPlayer() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentSong, isPlaying, position, duration, pauseSong, resumeSong } =
    useAudio();
  const { tabBarTranslateY } = useSelectionMode();

  if (!currentSong) return null;

  const handlePlaybackToggle = async () => {
    if (isPlaying) {
      await pauseSong();
    } else {
      await resumeSong();
    }
  };

  const progressPercent = Math.min(
    Math.max((position / duration) * 100, 0),
    100,
  );

  // Base resting bottom offset when TabBar is visible
  const baseBottom = TAB_BAR_HEIGHT + (Platform.OS === "ios" ? 10 : 8);

  // Map tabBarTranslateY to push the MiniPlayer entirely off-screen (150px down) when selection mode is active
  const translateY = tabBarTranslateY.interpolate({
    inputRange: [0, TAB_BAR_HEIGHT],
    outputRange: [0, TAB_BAR_HEIGHT + 150],
    extrapolate: "clamp",
  });

  return (
    <Animated.View
      style={[
        styles.wrapper,
        {
          bottom: baseBottom,
          transform: [{ translateY }],
        },
      ]}
    >
      <TouchableOpacity
        activeOpacity={0.9}
        onPress={() => router.push("/player")}
        style={[
          styles.content,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Left Block: Album Thumbnail Artwork */}
        <Image
          source={
            currentSong.custom_artwork_path
              ? { uri: currentSong.custom_artwork_path }
              : placeholderIcon
          }
          style={styles.artwork}
        />

        {/* Middle Block: Labels + Progress Bar Stack */}
        <View style={styles.metaContainer}>
          <View style={styles.textRow}>
            <View
              pointerEvents="none"
              style={{ width: "100%", overflow: "hidden" }}
            >
              <TextTicker
                style={[styles.title, { color: colors.text }]}
                duration={11000}
                loop
                bounce={false}
                repeatSpacer={40}
                marqueeDelay={1200}
              >
                {`${currentSong.title} • ${currentSong.artist || "Unknown Artist"}`}
              </TextTicker>
            </View>
          </View>

          {/* Progress Tracker */}
          <View
            style={[styles.progressTrack, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressFill,
                {
                  backgroundColor: colors.primary || colors.background,
                  width: `${progressPercent}%`,
                },
              ]}
            />
          </View>
        </View>

        {/* Right Block: Play/Pause Button */}
        <TouchableOpacity
          onPress={handlePlaybackToggle}
          style={styles.playButton}
          activeOpacity={0.7}
        >
          <Ionicons
            name={isPlaying ? "pause-outline" : "play-outline"}
            size={24}
            color={colors.text}
          />
        </TouchableOpacity>
      </TouchableOpacity>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    position: "absolute",
    width: "94%",
    alignSelf: "center",
    zIndex: 99,
  },
  content: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderRadius: 14,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.12,
    shadowRadius: 6,
  },
  artwork: {
    width: 48,
    height: 48,
    borderRadius: 8,
    marginRight: 12,
  },
  metaContainer: {
    flex: 1,
    justifyContent: "center",
    paddingRight: 12,
    overflow: "hidden",
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
    width: "100%",
    overflow: "hidden",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
