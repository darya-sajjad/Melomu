import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React from "react";
import {
    Dimensions,
    Image,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

const { width } = Dimensions.get("window");

export default function FullPlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { currentSong, isPlaying, position, duration, pauseSong, resumeSong } =
    useAudio();

  if (!currentSong) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No song selected</Text>
      </View>
    );
  }

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const progressPercent = Math.min(
    Math.max((position / duration) * 100, 0),
    100,
  );

  const handlePlaybackToggle = async () => {
    if (isPlaying) {
      await pauseSong();
    } else {
      await resumeSong();
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Top Header Navigation Panel matching your Figma header rows */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.headerIcon}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Now Playing:
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* Main Centered Artwork Frame wrapper */}
      <View style={styles.artworkContainer}>
        <Image
          source={placeholderIcon}
          style={[styles.albumArt, { backgroundColor: colors.surface }]}
          resizeMode="cover"
        />
      </View>

      {/* Text labels frame block stacked right above the control systems */}
      <View style={styles.metaBlock}>
        <Text
          style={[styles.songTitle, { color: colors.text }]}
          numberOfLines={1}
        >
          {currentSong.title}
        </Text>
        <Text
          style={[styles.songArtist, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {currentSong.artist || "Unknown Artist"}
        </Text>
      </View>

      {/* Precise Tracking Progress Deck */}
      <View style={styles.progressDeck}>
        <View
          style={[styles.progressTrack, { backgroundColor: colors.border }]}
        >
          <View
            style={[
              styles.progressFill,
              { backgroundColor: colors.primary, width: `${progressPercent}%` },
            ]}
          />
        </View>
        <View style={styles.timeLabelsRow}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* Main Audio Buttons Command Center Panel layout */}
      <View style={styles.controlsRow}>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons
            name="shuffle-outline"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="play-skip-back" size={26} color={colors.text} />
        </TouchableOpacity>

        {/* Center Circular Button matching your custom colored bubble fill theme design */}
        <TouchableOpacity
          style={[styles.playButtonCircle, { backgroundColor: colors.primary }]}
          onPress={handlePlaybackToggle}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={28}
            color="#FFFFFF"
            style={!isPlaying ? { marginLeft: 3 } : null} // Centers play button visually
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="play-skip-forward" size={26} color={colors.text} />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons
            name="repeat-outline"
            size={24}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Footer Placeholder matching the layout text line positions from your image */}
      <View style={styles.footerRow}>
        <Text style={[styles.footerText, { color: colors.text }]}>Lyrics</Text>
        <TouchableOpacity activeOpacity={0.7}>
          <Ionicons name="menu" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 44, // Ensures spacing handles phone notch boundaries natively
    paddingBottom: 24,
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
  },
  headerIcon: {
    padding: 4,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  artworkContainer: {
    alignItems: "center",
    justifyContent: "center",
    marginVertical: 20,
  },
  albumArt: {
    width: width * 0.84,
    height: width * 0.84,
    borderRadius: 16, // Subtle rounded edge framework matching your screenshot layout
  },
  metaBlock: {
    marginTop: 10,
    marginBottom: 16,
  },
  songTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
  },
  songArtist: {
    fontSize: 15,
  },
  progressDeck: {
    marginBottom: 20,
  },
  progressTrack: {
    height: 4, // Sleek, thin tracking strip matching your layout
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
  },
  timeLabelsRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  timeText: {
    fontSize: 12,
    fontWeight: "400",
  },
  controlsRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    marginBottom: 40,
  },
  playButtonCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderTopWidth: 0, // Keeps look completely clean as placeholder
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
