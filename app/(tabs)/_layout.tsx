import MiniPlayer from "@/components/MiniPlayer";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { LinearGradient } from "expo-linear-gradient";
import { Tabs } from "expo-router";
import React from "react";
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
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarShowLabel: false, // Hides text under icons for clean icon-only look in mockup
          tabBarStyle: {
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            elevation: 0,
            borderTopWidth: 0, // Removes sharp dividing line
            backgroundColor: "transparent", // Lets linear gradient show through
            height: 65,
          },
          tabBarBackground: () => (
            <LinearGradient
              colors={["rgba(30, 30, 30, 0)", "#1E1E1E"]}
              locations={[0.0037, 0.8963]}
              start={{ x: 0.5, y: 0 }}
              end={{ x: 0.5, y: 1 }}
              style={{
                position: "absolute",
                top: -120, // ✨ Pulls the top edge of the gradient 60px upwards
                left: 0,
                right: 0,
                bottom: 0,
              }}
            />
          ),
          headerStyle: {
            backgroundColor: colors.surface,
          },
          headerTintColor: colors.text,
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
                size={25}
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
                size={25}
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
                size={25}
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
