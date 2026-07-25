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
  withTiming,
} from "react-native-reanimated";

const { width } = Dimensions.get("window");
const SWIPE_THRESHOLD = width * 0.25;
const VELOCITY_THRESHOLD = 800; // px/s — lets a fast flick trigger a swipe even under the distance threshold

export interface CarouselTrack {
  id?: string | number;
  artwork?: string | null;
}

interface Props {
  currentTrack: CarouselTrack;
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
  const isDragging = useSharedValue(0); // 0/1, drives the subtle "lift" scale
  const lastDirection = useSharedValue(0); // -1 or 1, used to animate the next track in from the correct side

  // Entrance animation whenever the track changes — slides + fades in from
  // the side it was swiped toward, instead of hard-cutting.
  useEffect(() => {
    const dir = lastDirection.value;
    translateX.value = dir * width * 0.45;
    translateX.value = withTiming(0, {
      duration: 280,
      easing: Easing.out(Easing.cubic),
    });
  }, [currentTrack?.id]);

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-15, 15])
    .onBegin(() => {
      isDragging.value = withTiming(1, { duration: 120 });
    })
    .onUpdate((event) => {
      translateX.value = event.translationX;
    })
    .onEnd((event) => {
      isDragging.value = withTiming(0, { duration: 120 });

      const isFastFlick = Math.abs(event.velocityX) > VELOCITY_THRESHOLD;
      const passedThreshold = Math.abs(event.translationX) > SWIPE_THRESHOLD;
      const swipedLeft = event.translationX < 0 || event.velocityX < 0;

      if (passedThreshold || isFastFlick) {
        const direction = swipedLeft ? -1 : 1;
        lastDirection.value = direction;

        // Continue in the flick direction with a velocity-aware duration —
        // fast flicks exit quicker, slow deliberate drags exit a bit slower.
        const exitDuration = Math.max(
          140,
          220 - Math.abs(event.velocityX) / 20,
        );

        translateX.value = withTiming(
          direction * width * 1.15,
          { duration: exitDuration, easing: Easing.out(Easing.cubic) },
          () => {
            if (direction === -1) {
              runOnJS(onNextTrack)();
            } else {
              runOnJS(onPreviousTrack)();
            }
          },
        );
      } else {
        // Didn't clear the threshold — settle back decisively, no overshoot.
        // (A spring here is what was causing the "bounce" feeling.)
        translateX.value = withTiming(0, {
          duration: 240,
          easing: Easing.out(Easing.cubic),
        });
      }
    });

  // Decorative cards peeking out from behind the main artwork — pure staging,
  // no real neighbor-track data required. They drift slightly slower than the
  // drag (parallax) so the whole thing reads as a stack/carousel with depth.
  const leftStackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.15 }, { rotate: "-6deg" }],
  }));

  const rightStackStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value * 0.15 }, { rotate: "6deg" }],
  }));

  const animatedStyle = useAnimatedStyle(() => {
    const dragDistance = Math.abs(translateX.value);

    // Tighter interpolation range (half the swipe threshold to just past it)
    // so the scale/opacity/rotation are actually visible while dragging,
    // instead of only showing up near the edge of the screen.
    const dragScale = interpolate(
      dragDistance,
      [0, SWIPE_THRESHOLD * 1.5],
      [1, 0.9],
      Extrapolation.CLAMP,
    );

    // Slight "lift" as soon as you touch it, before any real drag scaling
    // dominates — makes it feel picked up rather than just squished.
    const liftScale = interpolate(isDragging.value, [0, 1], [1, 1.03]);

    const opacity = interpolate(
      dragDistance,
      [0, SWIPE_THRESHOLD * 1.8],
      [1, 0.55],
      Extrapolation.CLAMP,
    );

    const rotate = interpolate(
      translateX.value,
      [-width, 0, width],
      [-10, 0, 10],
      Extrapolation.CLAMP,
    );

    return {
      opacity,
      transform: [
        { translateX: translateX.value },
        { scale: dragScale * liftScale },
        { rotate: `${rotate}deg` },
      ],
    };
  });

  return (
    <View>
      {/* Navigation Header */}
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

        <View style={styles.headerIconPlaceholder} />
      </View>

      {/* Interactive Swipable Album Artwork */}
      <GestureHandlerRootView style={styles.artworkContainer}>
        {/* Decorative peeking cards — gives a carousel/stack impression
            without needing real previous/next track artwork. */}
        <Animated.View
          style={[
            styles.stackCard,
            { backgroundColor: colors.surface },
            leftStackStyle,
          ]}
        />
        <Animated.View
          style={[
            styles.stackCard,
            { backgroundColor: colors.surface },
            rightStackStyle,
          ]}
        />

        <GestureDetector gesture={panGesture}>
          <Animated.View style={[styles.artworkCard, animatedStyle]}>
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
    height: width * 0.88,
    marginVertical: 10,
    alignItems: "center",
    justifyContent: "center",
  },
  artworkCard: {
    width: width * 0.82,
    height: width * 0.82,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 8,
  },
  stackCard: {
    position: "absolute",
    width: width * 0.74,
    height: width * 0.74,
    borderRadius: 16,
    opacity: 0.35,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 3,
  },
  albumArt: {
    width: "100%",
    height: "100%",
    borderRadius: 16,
  },
});
