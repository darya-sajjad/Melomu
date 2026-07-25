import MiniPlayer from "@/components/MiniPlayer";
import {
  SelectionModeProvider,
  TAB_BAR_HEIGHT,
  useSelectionMode,
} from "@/constants/Selectionmodecontext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform, StyleSheet, View } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

function TabLayoutInner() {
  const context = useTheme();
  const { isSelectionModeActive } = useSelectionMode();

  if (!context || !context.colors) {
    return null;
  }
  const { colors } = context;

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: true,
          tabBarLabelStyle: {
            fontSize: 11,
            fontWeight: "600",
            marginBottom: Platform.OS === "ios" ? 4 : 6,
          },
          tabBarStyle: {
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            height: TAB_BAR_HEIGHT,
            paddingTop: 8,
            paddingBottom: Platform.OS === "ios" ? 28 : 8,
            // 1. Position absolute lets the screen content fill the device behind the tab bar
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            // 2. Animate ONLY the tab bar here, not the whole Tabs wrapper
            display: isSelectionModeActive ? "none" : "flex",
            transform: [
              { translateY: isSelectionModeActive ? TAB_BAR_HEIGHT : 0 },
            ],
          },
          tabBarItemStyle: {
            justifyContent: "center",
            alignItems: "center",
          },
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            headerShown: false,
            title: "Home",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "home" : "home-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="library"
          options={{
            headerShown: false,
            title: "Library",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "musical-notes" : "musical-notes-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="settings"
          options={{
            headerShown: false,
            title: "Settings",
            tabBarIcon: ({ color, focused }) => (
              <Ionicons
                name={focused ? "cog" : "cog-outline"}
                size={24}
                color={color}
              />
            ),
          }}
        />
        <Tabs.Screen
          name="playlist"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="album"
          options={{ href: null, headerShown: false }}
        />
        <Tabs.Screen
          name="artist"
          options={{ href: null, headerShown: false }}
        />
      </Tabs>

      {/* Floating MiniPlayer */}
      <MiniPlayer />
    </View>
  );
}

export default function TabLayout() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SelectionModeProvider>
        <TabLayoutInner />
      </SelectionModeProvider>
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
});
