import placeholderIcon from "@/assets/icon.png";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useEffect } from "react";
import {
  Dimensions,
  Image,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import {
  Gesture,
  GestureDetector,
  GestureHandlerRootView,
} from "react-native-gesture-handler";
import Animated, {
  Easing,
  Extrapolation,
  interpolate,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const ARTWORK_SIZE = width * 0.78;
const SWIPE_THRESHOLD = width * 0.18;
const VELOCITY_THRESHOLD = 600;

interface Props {
  currentTrack: {
    id?: string | number;
    artwork?: string | null;
  };
  onNextTrack: () => void;
  onPreviousTrack: () => void;
}

export default function PlayerHeaderArtwork({
  currentTrack,
  onNextTrack,
  onPreviousTrack,
}: Props) {
  const router = useRouter();
  const { colors } = useTheme();

  const translateX = useSharedValue(0);
  const isDragging = useSharedValue(0);
  const lastSwipeDirection = useSharedValue(0);

  useEffect(() => {
    if (lastSwipeDirection.value !== 0) {
      translateX.value = -lastSwipeDirection.value * width * 0.5;
      translateX.value = withSpring(0, {
        damping: 15,
        stiffness: 120,
        mass: 0.8,
      });
      lastSwipeDirection.value = 0;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentTrack?.id]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-20, 20])
    .onBegin(() => {
      isDragging.value = withTiming(1, { duration: 100 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      isDragging.value = withTiming(0, { duration: 100 });

      const swipedLeft =
        event.translationX < -SWIPE_THRESHOLD ||
        event.velocityX < -VELOCITY_THRESHOLD;
      const swipedRight =
        event.translationX > SWIPE_THRESHOLD ||
        event.velocityX > VELOCITY_THRESHOLD;

      if (swipedLeft) {
        lastSwipeDirection.value = -1;
        translateX.value = withTiming(
          -width,
          { duration: 220, easing: Easing.out(Easing.cubic) },
          () => {
            runOnJS(onNextTrack)();
          },
        );
      } else if (swipedRight) {
        lastSwipeDirection.value = 1;
        translateX.value = withTiming(
          width,
          { duration: 220, easing: Easing.out(Easing.cubic) },
          () => {
            runOnJS(onPreviousTrack)();
          },
        );
      } else {
        translateX.value = withSpring(0, {
          damping: 20,
          stiffness: 200,
        });
      }
    });

  const animatedStyle = useAnimatedStyle(() => {
    const dragDistance = Math.abs(translateX.value);

    const dragScale = interpolate(
      dragDistance,
      [0, width * 0.5],
      [1, 0.92],
      Extrapolation.CLAMP,
    );

    const liftScale = interpolate(isDragging.value, [0, 1], [1, 1.02]);

    const opacity = interpolate(
      dragDistance,
      [0, width * 0.6],
      [1, 0.4],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        { translateX: translateX.value },
        { scale: dragScale * liftScale },
      ],
    };
  });

  return (
    <View>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.7}
          style={styles.headerIcon}
        >
          <Ionicons name="arrow-back" size={28} color={colors.text} />
        </TouchableOpacity>

        <Text style={[styles.headerTitle, { color: colors.text }]}>
          Now Playing
        </Text>

        <View style={styles.headerIconPlaceholder} />
      </View>

      <GestureHandlerRootView style={styles.artworkContainer}>
        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.shadowWrapper, animatedStyle]}>
            <Image
              source={
                currentTrack?.artwork
                  ? { uri: currentTrack.artwork }
                  : placeholderIcon
              }
              style={[styles.albumArt, { backgroundColor: colors.surface }]}
              resizeMode="cover"
            />
          </Animated.View>
        </GestureDetector>
      </GestureHandlerRootView>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    height: 56,
    paddingBottom: 18,
  },
  headerIcon: {
    padding: 4,
  },
  headerIconPlaceholder: {
    width: 34,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: "500",
    letterSpacing: 0.5,
  },
  artworkContainer: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 24,
    paddingBottom: 40,
  },
  shadowWrapper: {
    width: ARTWORK_SIZE,
    height: ARTWORK_SIZE,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 12,
  },
  albumArt: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
});
