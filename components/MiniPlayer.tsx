import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import { Image, StyleSheet, TouchableOpacity, View } from "react-native";
import TextTicker from "react-native-text-ticker";

export default function MiniPlayer() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentSong, isPlaying, position, duration, pauseSong, resumeSong } =
    useAudio();

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

  return (
    <TouchableOpacity
      activeOpacity={0.9}
      onPress={() => router.push("/player")} // This slides up your new app/player.tsx screen!
      style={[
        styles.container,
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

      {/* Middle Block: Labels + Figma Progress Bar Stack */}
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

        {/* Custom Figma Progress Line Tracker Track */}
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.background,
                width: `${progressPercent}%`,
              },
            ]}
          />
        </View>
      </View>

      {/* Right Block: Interactive Symbol Button Trigger */}
      {/* Note: We wrap the button icon in a nested TouchableOpacity so tapping the play icon doesn't accidentally trigger the page routing step */}
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
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 90,
    width: 412,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 11,
    paddingHorizontal: 16,
    borderTopWidth: 1,
    borderRadius: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
  },
  artwork: {
    width: 52,
    height: 52,
    borderRadius: 5,
    marginRight: 12,
  },
  artworkShadow: {
    shadowColor: "#1E1E1E",
    shadowOffset: { width: -2, height: 4 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
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
    marginBottom: 8,
    width: "100%",
    overflow: "hidden",
  },
  title: {
    fontSize: 14,
    fontWeight: "600",
  },
  artist: {
    fontSize: 12,
    marginTop: 2,
  },
  progressTrack: {
    height: 5,
    borderRadius: 2,
    borderWidth: 1,
    borderColor: "#1B4965",
    width: "100%",
    overflow: "hidden",
  },
  progressFill: {
    height: "100%",
    borderRadius: 0,
  },
  playButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
});
