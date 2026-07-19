import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import {
    Dimensions,
    Image,
    Modal, // ✨ Fixed: Added missing ScrollView import
    Platform, // ✨ Fixed: Added missing Modal import
    ScrollView,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

// Extract layout dimension values safely
const { width, height: screenHeight } = Dimensions.get("window");

export default function FullPlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    currentLyrics,
    pauseSong,
    resumeSong,
    reloadLyrics,
  } = useAudio();

  const [isLyricsVisible, setIsLyricsVisible] = useState(false);

  useEffect(() => {
    if (isLyricsVisible) {
      reloadLyrics();
    }
  }, [isLyricsVisible, reloadLyrics]);

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

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* 1. Top Header Navigation Panel */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.headerIcon}
        >
          <Ionicons name="arrow-back" size={26} color={colors.text} />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Now Playing
        </Text>
        <TouchableOpacity activeOpacity={0.7} style={styles.headerIcon}>
          <Ionicons name="ellipsis-vertical" size={24} color={colors.text} />
        </TouchableOpacity>
      </View>

      {/* 2. Album Artwork Canvas */}
      <View style={styles.artworkContainer}>
        <Image
          source={placeholderIcon}
          style={[styles.albumArt, { backgroundColor: colors.surface }]}
          resizeMode="cover"
        />
      </View>

      {/* 3. Song Info Labels Row */}
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

      {/* 4. Progress Slider Deck */}
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
        <View style={timeLabelsRowStyles.row}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(position)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(duration)}
          </Text>
        </View>
      </View>

      {/* 5. Media Controls Deck */}
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
        <TouchableOpacity
          style={[styles.playButtonCircle, { backgroundColor: colors.primary }]}
          onPress={isPlaying ? pauseSong : resumeSong}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={28}
            color="#FFFFFF"
            style={!isPlaying ? { marginLeft: 3 } : null}
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

      {/* 6. Footer Lyrics Row Button */}
      <TouchableOpacity
        style={styles.footerRow}
        activeOpacity={0.7}
        onPress={() => setIsLyricsVisible(true)}
      >
        <Text style={[styles.footerText, { color: colors.text }]}>Lyrics</Text>
        <Ionicons name="menu" size={24} color={colors.text} />
      </TouchableOpacity>

      <Modal
        visible={isLyricsVisible}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setIsLyricsVisible(false)}
      >
        <View style={styles.lyricsModalWrapper}>
          {/* Top Panel: Navigation Row containing your Down Arrow */}
          <View
            style={[
              styles.lyricsHeaderNav,
              { backgroundColor: colors.background },
            ]}
          >
            <TouchableOpacity
              onPress={() => setIsLyricsVisible(false)}
              activeOpacity={0.7}
              style={styles.backButtonTouchable}
            >
              {/* Down Arrow replaces the old horizontal grab bar for clean accessibility */}
              <Ionicons name="chevron-down" size={28} color={colors.text} />
            </TouchableOpacity>
          </View>

          {/* Main Content Area Canvas featuring your custom curved border layout shape */}
          <View
            style={[
              styles.curvedLyricsCanvas,
              { backgroundColor: colors.surface, borderColor: colors.border },
            ]}
          >
            {/* Song Details Header inside the panel container */}
            <View style={styles.panelMetaRow}>
              <Text
                style={[styles.panelSongTitle, { color: colors.text }]}
                numberOfLines={1}
              >
                {currentSong.title}
              </Text>
              <Text
                style={[
                  styles.panelSongArtist,
                  { color: colors.textSecondary },
                ]}
                numberOfLines={1}
              >
                {currentSong.artist || "Unknown Artist"}
              </Text>
            </View>

            {/* Immersive Left-Aligned Lyrics Scroll Board Container */}
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.lyricsScrollContainer}
            >
              <Text style={[styles.figmaLyricsText, { color: colors.text }]}>
                {currentLyrics || "Searching for plain text lyrics lines..."}
              </Text>
            </ScrollView>
          </View>
        </View>
      </Modal>
    </View>
  );
}

// Separate helper block to resolve multi-sentence structure naming collisions
const timeLabelsRowStyles = StyleSheet.create({
  row: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
});

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: Platform.OS === "ios" ? 54 : 34,
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
    borderRadius: 16,
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
    height: 4,
    borderRadius: 2,
    width: "100%",
    overflow: "hidden",
    marginBottom: 8,
  },
  progressFill: {
    height: "100%",
    borderRadius: 2,
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
    paddingTop: 12,
    paddingHorizontal: 4,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "600",
  },

  //Lyrics View
  lyricsModalWrapper: {
    flex: 1,
    backgroundColor: "transparent",
  },
  lyricsHeaderNav: {
    height: Platform.OS === "ios" ? 110 : 95,
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingTop: Platform.OS === "ios" ? 48 : 24,
    marginTop: 0,
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  // Creates the stylized curved canvas background layout wrapper under your navigation header rows
  curvedLyricsCanvas: {
    flex: 1,
    borderTopLeftRadius: 32, // Curved borders matching your design profile specifications
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  panelMetaRow: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 28,
  },
  panelSongTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  panelSongArtist: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  lyricsScrollContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 80,
  },
  figmaLyricsText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "left",
    letterSpacing: -0.2,
  },
});
