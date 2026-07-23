import MiniPlayer from "@/components/MiniPlayer";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Tabs } from "expo-router";
import React from "react";
import { Platform } from "react-native";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function TabLayout() {
  const context = useTheme();
  if (!context || !context.colors) {
    return null;
  }
  const { colors } = context;

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
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
            // Adding 'CC' at the end gives ~80% opacity. Change to '99' or '80' for more transparency
            backgroundColor: colors.surface,
            borderTopColor: colors.border,
            borderTopWidth: 0.5,
            height: Platform.OS === "ios" ? 88 : 65,
            paddingTop: 8, // Moves the icon slightly down towards vertical center
            paddingBottom: Platform.OS === "ios" ? 28 : 8,
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
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="album"
          options={{
            href: null,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="artist"
          options={{
            href: null,
            headerShown: false,
          }}
        />
      </Tabs>
      <MiniPlayer />
    </GestureHandlerRootView>
  );
}
