import React, { useEffect, useRef, useState } from "react";
import {
    Animated,
    Easing,
    LayoutChangeEvent,
    StyleProp,
    StyleSheet,
    Text,
    TextStyle,
    View,
} from "react-native";

interface ScrollingTextProps {
  text: string;
  style?: StyleProp<TextStyle>;
  numberOfLines?: number;
}

export const ScrollingText: React.FC<ScrollingTextProps> = ({
  text,
  style,
}) => {
  const [containerWidth, setContainerWidth] = useState(0);
  const [textWidth, setTextWidth] = useState(0);
  const animatedValue = useRef(new Animated.Value(0)).current;

  const isOverflowing = textWidth > containerWidth && containerWidth > 0;

  useEffect(() => {
    if (!isOverflowing) {
      animatedValue.setValue(0);
      return;
    }

    const scrollDistance = textWidth - containerWidth + 24; // Extra padding
    const duration = Math.max(3000, scrollDistance * 40);

    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(1200), // Hold at start
        Animated.timing(animatedValue, {
          toValue: -scrollDistance,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
        Animated.delay(1000), // Hold at end
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: duration,
          easing: Easing.linear,
          useNativeDriver: true,
        }),
      ]),
    );

    animation.start();

    return () => animation.stop();
  }, [isOverflowing, textWidth, containerWidth]);

  const onContainerLayout = (e: LayoutChangeEvent) => {
    setContainerWidth(e.nativeEvent.layout.width);
  };

  const onTextLayout = (e: LayoutChangeEvent) => {
    setTextWidth(e.nativeEvent.layout.width);
  };

  return (
    <View
      style={styles.container}
      onLayout={onContainerLayout}
      pointerEvents="none"
    >
      {/* Hidden text element used strictly for pixel measurement */}
      <Text
        style={[style, styles.hiddenMeasureText]}
        onLayout={onTextLayout}
        numberOfLines={1}
      >
        {text}
      </Text>

      {isOverflowing ? (
        <Animated.View style={{ transform: [{ translateX: animatedValue }] }}>
          <Text style={[style, styles.singleLine]} numberOfLines={1}>
            {text}
          </Text>
        </Animated.View>
      ) : (
        <Text style={[style, styles.singleLine]} numberOfLines={1}>
          {text}
        </Text>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: "hidden",
    width: "100%",
  },
  hiddenMeasureText: {
    position: "absolute",
    opacity: 0,
    zIndex: -1,
  },
  singleLine: {
    flexWrap: "nowrap",
  },
});
