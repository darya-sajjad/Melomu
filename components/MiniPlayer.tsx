import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Image, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function MiniPlayer() {
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
    <View
      style={[
        styles.container,
        { backgroundColor: colors.surface, borderTopColor: colors.border },
      ]}
    >
      <View style={styles.artworkShadow}>
        <Image
          source={placeholderIcon} // Uses your default icon for now as placeholder
          style={styles.artwork}
        />
      </View>

      <View style={styles.metaContainer}>
        <View style={styles.textRow}>
          <Text
            style={[styles.title, { color: colors.text }]}
            numberOfLines={1}
          >
            {currentSong.title}
          </Text>
          <Text
            style={[styles.artist, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {" • "}
            {currentSong.artist}
          </Text>
        </View>

        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              {
                backgroundColor: colors.primary,
                width: `${progressPercent}%`, // Grows dynamically across the text base width!
              },
            ]}
          />
        </View>
      </View>

      <TouchableOpacity
        onPress={handlePlaybackToggle}
        style={[styles.playButton, { backgroundColor: colors.primary }]}
        activeOpacity={0.8}
      >
        <Ionicons
          name={isPlaying ? "pause" : "play"}
          size={20}
          color="#FFFFFF"
          style={!isPlaying ? { marginLeft: 2 } : null} // Centers the play icon triangle nicely
        />
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: "absolute",
    bottom: 85,
    width: 412,
    alignSelf: "center",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
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
    width: 50,
    height: 50,
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
  },
  textRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
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
