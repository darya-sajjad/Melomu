import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

// Import our custom theme tools
import { ThemeProvider, useTheme } from "@/constants/ThemeContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppContent() {
  const context = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    // Wait a brief instant to guarantee context variables exist in memory
    if (context && context.colors) {
      setIsReady(true);
    }
  }, [context]);

  // If the data is loading, show a clean fallback screen to prevent crashes
  if (!isReady || !context || !context.colors) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={context.theme === "dark" ? "light" : "dark"} />
    </>
  );
}

// Keep ThemeProvider at the absolute outer layer
export default function RootLayout() {
  return (
    <ThemeProvider>
      <AppContent />
    </ThemeProvider>
  );
}
