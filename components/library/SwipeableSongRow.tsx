import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Animated, StyleSheet } from "react-native";
import Swipeable from "react-native-gesture-handler/Swipeable";

interface Props {
  item: any;
  children: React.ReactNode;
}

export default function SwipeableSongRow({ item, children }: Props) {
  const { colors } = useTheme();
  const { addToQueue } = useAudio();
  const swipeableRef = useRef<Swipeable | null>(null);

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
      inputRange: [-100, -40, 0],
      outputRange: ["#1DB954", "#535353", colors.background],
      extrapolate: "clamp",
    });

    return (
      <Animated.View style={[styles.actionBackground, { backgroundColor }]}>
        <Animated.View style={{ opacity, transform: [{ scale }] }}>
          <Ionicons name="list" size={20} color="#FFFFFF" />
        </Animated.View>
        <Animated.Text
          style={{
            opacity,
            color: "#FFFFFF",
            marginLeft: 6,
            fontSize: 13,
            fontWeight: "600",
          }}
        >
          Queue
        </Animated.Text>
      </Animated.View>
    );
  };

  return (
    <Swipeable
      ref={swipeableRef}
      renderRightActions={renderRightActions}
      overshootRight={false}
      friction={2}
      onSwipeableOpen={() => {
        addToQueue(item);
        swipeableRef.current?.close();
      }}
    >
      {children}
    </Swipeable>
  );
}

const styles = StyleSheet.create({
  actionBackground: {
    justifyContent: "center",
    alignItems: "center",
    width: 100,
    marginVertical: 4,
    borderTopRightRadius: 12,
    borderBottomRightRadius: 12,
    borderTopLeftRadius: 0,
    borderBottomLeftRadius: 0,
    flexDirection: "row",
  },
});
