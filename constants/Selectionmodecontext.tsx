import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, Platform } from "react-native";

// Matches the tabBarStyle height values already used in _layout.tsx — keep
// these in sync if you ever change the tab bar's height there.
export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 65;

interface SelectionModeContextValue {
  isSelectionModeActive: boolean;
  setIsSelectionModeActive: (active: boolean) => void;
  // 0 when the tab bar is fully visible, TAB_BAR_HEIGHT when it's slid
  // fully off-screen. Both the tab bar and MiniPlayer read from this same
  // value so their motion stays perfectly in sync.
  tabBarTranslateY: Animated.Value;
}

const SelectionModeContext = createContext<SelectionModeContextValue | null>(
  null,
);

export function SelectionModeProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSelectionModeActive, setIsSelectionModeActiveState] =
    useState(false);
  const tabBarTranslateY = useRef(new Animated.Value(0)).current;

  const setIsSelectionModeActive = (active: boolean) => {
    setIsSelectionModeActiveState(active);
    Animated.timing(tabBarTranslateY, {
      toValue: active ? TAB_BAR_HEIGHT : 0,
      duration: 260,
      useNativeDriver: true,
    }).start();
  };

  return (
    <SelectionModeContext.Provider
      value={{
        isSelectionModeActive,
        setIsSelectionModeActive,
        tabBarTranslateY,
      }}
    >
      {children}
    </SelectionModeContext.Provider>
  );
}

export function useSelectionMode() {
  const ctx = useContext(SelectionModeContext);
  if (!ctx) {
    throw new Error(
      "useSelectionMode must be used within a SelectionModeProvider",
    );
  }
  return ctx;
}
