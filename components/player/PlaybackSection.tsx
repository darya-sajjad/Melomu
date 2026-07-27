import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Slider from "@react-native-community/slider";
import React, { useState } from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface Props {
  position: number;
  duration: number;
  isPlaying: boolean;
  shuffle: boolean;
  repeatMode: string;
  onSeek: (value: number) => Promise<void>;
  onPause: () => void;
  onResume: () => void;
  onNext: () => void;
  onPrevious: () => void;
  onToggleShuffle: () => void;
  onCycleRepeatMode: () => void;
}

export default function PlaybackSection({
  position,
  duration,
  isPlaying,
  shuffle,
  repeatMode,
  onSeek,
  onPause,
  onResume,
  onNext,
  onPrevious,
  onToggleShuffle,
  onCycleRepeatMode,
}: Props) {
  const { colors } = useTheme();
  const [isSeeking, setIsSeeking] = useState(false);
  const [seekValue, setSeekValue] = useState(0);

  const displayedPosition = isSeeking ? seekValue : position;

  const formatTime = (millis: number) => {
    const totalSeconds = Math.floor(millis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  const formatRemainingTime = (currentMillis: number, totalMillis: number) => {
    const remainingMillis = Math.max(0, totalMillis - currentMillis);
    const totalSeconds = Math.floor(remainingMillis / 1000);
    const mins = Math.floor(totalSeconds / 60);
    const secs = totalSeconds % 60;
    return `-${mins}:${secs < 10 ? "0" : ""}${secs}`;
  };

  return (
    <View>
      <View style={styles.progressDeck}>
        <Slider
          style={{ width: "100%", height: 32 }}
          minimumValue={0}
          maximumValue={duration || 1}
          value={displayedPosition}
          minimumTrackTintColor={colors.primary}
          maximumTrackTintColor={colors.surface}
          thumbTintColor={colors.primary}
          onSlidingStart={() => setIsSeeking(true)}
          onValueChange={(val) => setSeekValue(val)}
          onSlidingComplete={async (val) => {
            await onSeek(val);
            setIsSeeking(false);
          }}
        />
        <View style={styles.timeLabelsRow}>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatTime(displayedPosition)}
          </Text>
          <Text style={[styles.timeText, { color: colors.textSecondary }]}>
            {formatRemainingTime(displayedPosition, duration)}
          </Text>
        </View>
      </View>

      <View style={styles.controlsRow}>
        <TouchableOpacity activeOpacity={0.7} onPress={onToggleShuffle}>
          <Ionicons
            name="shuffle"
            size={24}
            color={shuffle ? colors.active : colors.primary}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onPrevious}>
          <Ionicons name="play-skip-back" size={26} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.playButtonCircle, { backgroundColor: colors.primary }]}
          onPress={isPlaying ? onPause : onResume}
          activeOpacity={0.8}
        >
          <Ionicons
            name={isPlaying ? "pause" : "play"}
            size={30}
            color={colors.background}
            style={!isPlaying ? { marginLeft: 3 } : null}
          />
        </TouchableOpacity>

        <TouchableOpacity activeOpacity={0.7} onPress={onNext}>
          <Ionicons name="play-skip-forward" size={26} color={colors.primary} />
        </TouchableOpacity>

        <TouchableOpacity
          activeOpacity={0.7}
          onPress={onCycleRepeatMode}
          style={styles.repeatButtonContainer}
        >
          <View style={styles.iconWrapper}>
            <Ionicons
              name={repeatMode === "one" ? "repeat" : "repeat-outline"}
              size={2}
              color={repeatMode !== "off" ? colors.active : colors.primary}
            />
            {repeatMode === "one" && (
              <View
                style={[
                  styles.tinyBadgeCircle,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={[styles.tinyBadgeText, { color: colors.texttwo }]}>
                  1
                </Text>
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  progressDeck: {
    marginBottom: 24,
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
  repeatButtonContainer: {
    alignItems: "center",
    justifyContent: "center",
  },
  iconWrapper: {
    position: "relative",
    width: 26,
    height: 26,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyBadgeCircle: {
    position: "absolute",
    bottom: -2,
    right: -4,
    width: 12,
    height: 12,
    borderRadius: 6,
    alignItems: "center",
    justifyContent: "center",
  },
  tinyBadgeText: {
    fontSize: 9,
    fontWeight: "800",
    lineHeight: 10,
    textAlign: "center",
  },
});
