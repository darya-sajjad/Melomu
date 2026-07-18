import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";
// Pull your custom theme context tokens
import { useTheme } from "@/constants/ThemeContext";

export default function HomeScreen() {
  // Access your custom dark/light colors and the switch toggle
  const { colors, theme, toggleTheme } = useTheme();

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Title Styled by Figma Tokens */}
      <Text style={[styles.title, { color: colors.text }]}>
        Welcome to Melomu 🎵
      </Text>

      <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
        Current Mode:{" "}
        <Text style={{ fontWeight: "bold" }}>{theme.toUpperCase()}</Text>
      </Text>

      {/* A clean action button styled by your theme palette */}
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={toggleTheme}
        activeOpacity={0.8}
      >
        <Text style={styles.buttonText}>Switch Theme</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 20,
  },
  title: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 32,
  },
  button: {
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    elevation: 2, // shadow for Android
    shadowColor: "#000", // shadow for iOS
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  buttonText: {
    color: "#FFFFFF",
    fontSize: 16,
    fontWeight: "600",
  },
});
