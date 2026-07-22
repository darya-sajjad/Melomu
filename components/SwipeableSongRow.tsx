import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Animated, StyleSheet } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface Props {
  item: any;
  children: React.ReactNode;
}

export default function SwipeableSongRow({ item, children }: Props) {
  const { colors } = useTheme();
  const { addToQueue } = useAudio();
  let swipeableRef: Swipeable | null = null;

  const renderRightActions = (
    progress: Animated.AnimatedInterpolation<number>,
    dragX: Animated.AnimatedInterpolation<number>,
  ) => {
    const opacity = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.5, 0],
      extrapolate: "clamp",
    });

    const scale = dragX.interpolate({
      inputRange: [-80, -20, 0],
      outputRange: [1, 0.8, 0.5],
      extrapolate: "clamp",
    });

    const backgroundColor = dragX.interpolate({
      inputRange: [-80, -30, 0],
      outputRange: [colors.primary, "#404040", colors.background],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.actionBackground, { backgroundColor }]}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Ionicons name="list" size={24} color="#FFFFFF" />
        </Animated.View>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={(ref) => {
        swipeableRef = ref;
      }}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      onSwipeableOpen={() => {
        addToQueue(item);
        swipeableRef?.close();
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionBackground: {
    justifyContent: "center",
    alignItems: "flex-end",
    paddingRight: 24,
    flex: 1,
    marginVertical: 4,
    borderRadius: 12,
  },
});
