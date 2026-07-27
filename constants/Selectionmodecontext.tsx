import React, { createContext, useContext, useRef, useState } from "react";
import { Animated, Platform } from "react-native";

export const TAB_BAR_HEIGHT = Platform.OS === "ios" ? 88 : 65;

interface SelectionModeContextValue {
  isSelectionModeActive: boolean;
  setIsSelectionModeActive: (active: boolean) => void;
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
