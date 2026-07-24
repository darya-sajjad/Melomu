import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import {
    Animated,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import TextTicker from "react-native-text-ticker";

interface Props {
  title: string;
  artist?: string;
  isFavorite: boolean;
  onToggleFavorite: () => void;
}

export default function TrackInfo({
  title,
  artist,
  isFavorite,
  onToggleFavorite,
}: Props) {
  const { colors } = useTheme();
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handleFavoritePress = () => {
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.3,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 4,
        useNativeDriver: true,
      }),
    ]).start();

    onToggleFavorite();
  };

  return (
    <View style={styles.songHeaderRow}>
      <View style={styles.metaBlock}>
        <View
          pointerEvents="none"
          style={{ width: "100%", overflow: "hidden" }}
        >
          <TextTicker
            style={[styles.songTitle, { color: colors.text }]}
            duration={13000}
            loop
            bounce={false}
            repeatSpacer={45}
            marqueeDelay={1200}
          >
            {title}
          </TextTicker>
        </View>
        <Text
          style={[styles.songArtist, { color: colors.textSecondary }]}
          numberOfLines={1}
        >
          {artist || "Unknown Artist"}
        </Text>
      </View>
      <TouchableOpacity
        activeOpacity={0.7}
        onPress={handleFavoritePress}
        style={styles.heartBtn}
      >
        <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
          <Ionicons
            name={isFavorite ? "heart" : "heart-outline"}
            size={28}
            color={isFavorite ? "#E94560" : colors.textSecondary}
          />
        </Animated.View>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  songHeaderRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    width: "100%",
    paddingHorizontal: 10,
    marginVertical: 10,
  },
  metaBlock: {
    marginTop: 10,
    marginBottom: 16,
    width: "80%",
    alignSelf: "flex-start",
    overflow: "hidden",
  },
  songTitle: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 4,
    letterSpacing: 0.2,
    width: "100%",
  },
  songArtist: {
    fontSize: 15,
  },
  heartBtn: {
    padding: 4,
  },
});
