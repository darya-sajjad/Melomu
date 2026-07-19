import { Ionicons } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker"; // <-- Clean, proper package name
import * as FileSystem from "expo-file-system/legacy";
import React, { useState } from "react";
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const [isImporting, setIsImporting] = useState(false);

  const handleImportMusicTrack = async () => {
    try {
      const selectedFile = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        copyToCacheDirectory: true,
      });

      if (
        selectedFile.canceled ||
        !selectedFile.assets ||
        selectedFile.assets.length === 0
      ) {
        return;
      }

      setIsImporting(true);

      // Extract the single target file asset safely out of the array
      const targetAsset = selectedFile.assets[0];

      // Read the stable string path from the legacy system
      const appStorageDirectory = FileSystem.documentDirectory;

      // 🛠️ FIX: Graceful check instead of throwing a fatal error
      if (!appStorageDirectory) {
        setIsImporting(false);
        Alert.alert(
          "Environment Limitation",
          "The native file sandbox is unavailable (Web/Expo Go dev sandbox restriction). To test file transfers, please switch to a native Android/iOS phone environment.",
        );
        return; // Exits function cleanly without crashing the console
      }

      // Generate a clean destination path ensuring it ends with a clean string name
      const cleanFileName = targetAsset.name.replace(/\s+/g, "_");
      const permanentFilePath = `${appStorageDirectory}${cleanFileName}`;

      console.log("🔄 Attempting secure copy from:", targetAsset.uri);
      console.log("🔄 Target sandbox path destination:", permanentFilePath);

      // Copy the complete raw sound file into permanent storage memory
      await FileSystem.copyAsync({
        from: targetAsset.uri,
        to: permanentFilePath,
      });

      // Clean up metadata strings for our user interface display card labels
      const cleanTitle = targetAsset.name
        .replace(/\.(mp3|m4a|wav|flac)$/i, "")
        .replace(/_/g, " ");
      const uniqueSongId = `user_track_${Date.now()}`;
      const fallbackDuration = 185;

      // Save the record inside local SQLite rows
      const db = await dbAsync;
      await db.runAsync(
        `INSERT INTO songs (id, file_path, title, artist, album, genre, duration) VALUES (?, ?, ?, ?, ?, ?, ?)`,
        [
          uniqueSongId,
          permanentFilePath,
          cleanTitle,
          "Imported Track",
          "My Files",
          "Local",
          fallbackDuration,
        ],
      );

      setIsImporting(false);
      Alert.alert(
        "Success 🎉",
        `"${cleanTitle}" added to your library! Check your Library tab.`,
      );
    } catch (error) {
      console.error("❌ Failed to pick or import audio track:", error);
      setIsImporting(false);
      Alert.alert("Error", "Could not complete audio file import.");
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>App Settings</Text>

      {/* Row Block 1: Theme Toggling Action */}
      <View
        style={[
          styles.settingRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.settingMeta}>
          <Ionicons name="moon-outline" size={22} color={colors.text} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Dark Mode Mode
          </Text>
        </View>
        <TouchableOpacity
          style={[styles.toggleButton, { backgroundColor: colors.primary }]}
          onPress={toggleTheme}
          activeOpacity={0.8}
        >
          <Text style={styles.toggleButtonText}>
            {theme === "dark" ? "ON" : "OFF"}
          </Text>
        </TouchableOpacity>
      </View>

      {/* Row Block 2: Storage Data Scanning Action */}
      <View
        style={[
          styles.settingRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.settingMeta}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.text} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Scan & Add Local Music
          </Text>
        </View>

        <TouchableOpacity
          style={[styles.importButton, { backgroundColor: colors.primary }]}
          onPress={handleImportMusicTrack}
          disabled={isImporting}
          activeOpacity={0.8}
        >
          {isImporting ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <>
              <Ionicons name="add" size={18} color="#FFFFFF" />
              <Text style={styles.importButtonText}>Import</Text>
            </>
          )}
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 24, marginTop: 10 },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 2,
    elevation: 1,
  },
  settingMeta: { flexDirection: "row", alignItems: "center" },
  settingLabel: { fontSize: 16, fontWeight: "500", marginLeft: 12 },
  toggleButton: { paddingVertical: 8, paddingHorizontal: 16, borderRadius: 10 },
  toggleButtonText: { color: "#FFFFFF", fontWeight: "700", fontSize: 12 },
  importButton: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  importButtonText: {
    color: "#FFFFFF",
    fontWeight: "600",
    fontSize: 13,
    marginLeft: 2,
  },
});
