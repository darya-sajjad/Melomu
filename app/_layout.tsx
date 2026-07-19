import { Stack } from "expo-router";
import { StatusBar } from "expo-status-bar";
import React, { useEffect, useState } from "react";
import "react-native-reanimated";

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
          name="modal"
          options={{ presentation: "modal", title: "Modal" }}
        />
      </Stack>
      <StatusBar style={context.theme === "dark" ? "light" : "dark"} />
    </>
  );
}

export default function RootLayout() {
  return (
    <ThemeProvider>
      <AudioProvider>
        {}
        <AppContent />
      </AudioProvider>
    </ThemeProvider>
  );
}
