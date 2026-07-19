import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

import { AudioProvider } from "@/constants/AudioContext";
import { initializeDatabase, seedMockSongs } from "@/constants/Database";
import { ThemeProvider, useTheme } from "@/constants/ThemeContext";

import MiniPlayer from "@/components/MiniPlayer"; // <-- Add this line!

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
      </Stack>
      <StatusBar style={context.theme === "dark" ? "light" : "dark"} />

      <MiniPlayer />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AudioProvider>
        <AppContent />
      </AudioProvider>
    </ThemeProvider>
  );
}
