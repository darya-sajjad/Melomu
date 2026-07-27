import LyricsModal from "@/components/player/LyricsModal";
import PlaybackSection from "@/components/player/PlaybackSection";
import PlayerHeaderArtwork from "@/components/player/PlayerHeaderArtwork";
import TrackInfo from "@/components/player/TrackInfo";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect, useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

export default function FullPlayerScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    currentSong,
    isPlaying,
    position,
    duration,
    currentLyrics,
    shuffle,
    repeatMode,
    isFavorite,
    pauseSong,
    resumeSong,
    playNext,
    playPrevious,
    toggleShuffle,
    cycleRepeatMode,
    reloadLyrics,
    seekTo,
    toggleFavorite,
  } = useAudio();

  const [isLyricsVisible, setIsLyricsVisible] = useState(false);

  useEffect(() => {
    if (isLyricsVisible && currentSong) {
      reloadLyrics();
    }
  }, [isLyricsVisible, currentSong, reloadLyrics]);

  if (!currentSong) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <Text style={{ color: colors.text }}>No song selected</Text>
      </View>
    );
  }

  return (
    <SafeAreaView
      style={[styles.SafeContainer, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      <GestureHandlerRootView style={{ flex: 1 }}>
        <View
          style={[styles.container, { backgroundColor: colors.background }]}
        >
          <PlayerHeaderArtwork
            currentTrack={{
              id: currentSong.id,
              artwork: currentSong.custom_artwork_path,
            }}
            onNextTrack={playNext}
            onPreviousTrack={playPrevious}
          />

          <TrackInfo
            title={currentSong.title}
            artist={currentSong.artist}
            isFavorite={isFavorite}
            onToggleFavorite={toggleFavorite}
          />

          <PlaybackSection
            position={position}
            duration={duration}
            isPlaying={isPlaying}
            shuffle={shuffle}
            repeatMode={repeatMode}
            onSeek={seekTo}
            onPause={pauseSong}
            onResume={resumeSong}
            onNext={playNext}
            onPrevious={playPrevious}
            onToggleShuffle={toggleShuffle}
            onCycleRepeatMode={cycleRepeatMode}
          />

          <View style={styles.footerRow}>
            <TouchableOpacity
              style={styles.lyricsButton}
              activeOpacity={0.7}
              onPress={() => setIsLyricsVisible(true)}
            >
              <Text style={[styles.footerText, { color: colors.text }]}>
                Lyrics
              </Text>
              <Ionicons
                name="chevron-up"
                size={20}
                color={colors.text}
                style={{ marginLeft: 6 }}
              />
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.queueButton}
              activeOpacity={0.7}
              onPress={() => router.push("./queue")}
            >
              <Ionicons name="list" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <LyricsModal
            visible={isLyricsVisible}
            songTitle={currentSong.title}
            artist={currentSong.artist}
            lyrics={currentLyrics}
            onClose={() => setIsLyricsVisible(false)}
          />
        </View>
      </GestureHandlerRootView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  SafeContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    paddingHorizontal: 28,
    paddingTop: 36,
  },
  footerRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingTop: 10,
    paddingHorizontal: 4,
  },
  lyricsButton: {
    flexDirection: "row",
    alignItems: "center",
  },
  queueButton: {
    padding: 6,
  },
  footerText: {
    fontSize: 18,
    fontWeight: "600",
  },
});
