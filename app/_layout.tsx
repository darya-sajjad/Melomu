import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";
import { SafeAreaProvider } from "react-native-safe-area-context";

import MiniPlayer from "@/components/MiniPlayer";
import { AudioProvider } from "@/constants/AudioContext";
import { initializeDatabase, seedMockSongs } from "@/constants/Database";
import { ThemeProvider, useTheme } from "@/constants/ThemeContext";

export const unstable_settings = {
  anchor: "(tabs)",
};

function AppContent() {
  const context = useTheme();
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    async function setupApp() {
      try {
        await initializeDatabase();
        await seedMockSongs();
      } catch (error) {
        console.error("Error starting database:", error);
      } finally {
        setIsReady(true);
      }
    }

    setupApp();
  }, []);

  if (!isReady || !context || !context.colors) {
    return null;
  }

  return (
    <>
      <Stack>
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="player"
          options={{ presentation: "modal", headerShown: false }}
        />
        <Stack.Screen
          name="queue"
          options={{ presentation: "modal", headerShown: false }}
        />
      </Stack>
      <StatusBar style={context.theme === "dark" ? "light" : "dark"} />
      <MiniPlayer />
    </>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <ThemeProvider>
        <AudioProvider>
          <AppContent />
        </AudioProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
