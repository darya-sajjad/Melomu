import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Buffer } from "buffer";
import { Audio } from "expo-av"; // ✨ Added to probe audio duration
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { parseBuffer } from "music-metadata";
import React, { useEffect, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const isFocused = useIsFocused();
  const [isImporting, setIsImporting] = useState(false);

  const [dbSongCount, setDbSongCount] = useState(0);
  const [storageSizeMB, setStorageSizeMB] = useState("0.0");

  const calculateDiagnosticMetrics = async () => {
    try {
      const db = await dbAsync;

      // 1. Query live SQLite row counts
      const countResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs",
      );
      const totalSongs = countResult?.total || 0;
      setDbSongCount(totalSongs);

      // 2. Scan the local sandboxed folder and add up file sizes
      const appDirectory = FileSystem.documentDirectory;
      if (appDirectory) {
        const files = await FileSystem.readDirectoryAsync(appDirectory);
        let totalBytes = 0;

        for (const fileName of files) {
          if (
            fileName.endsWith(".mp3") ||
            fileName.endsWith(".m4a") ||
            fileName.endsWith(".wav") ||
            fileName.endsWith(".flac")
          ) {
            const fileInfo = await FileSystem.getInfoAsync(
              `${appDirectory}${fileName}`,
            );
            if (fileInfo.exists) {
              totalBytes += fileInfo.size;
            }
          }
        }
        // Convert raw bytes mathematically into Megabytes formatted to 1 decimal place
        setStorageSizeMB((totalBytes / (1024 * 1024)).toFixed(1));
      }
    } catch (error) {
      console.error("Failed to compile diagnostic metrics:", error);
    }
  };

  // Automatically recalculate metrics whenever the user clicks open the Settings tab
  useEffect(() => {
    if (isFocused) {
      calculateDiagnosticMetrics();
    }
  }, [isFocused]);

  const handleNukeDatabaseCache = () => {
    Alert.alert(
      "☢️ Nuke Database & Cache?",
      "This developer action will permanently erase all imported songs from your device storage and wipe SQLite rows completely.",
      [
        { text: "Cancel", style: "cancel" },
        {
          text: "Wipe Everything",
          style: "destructive",
          onPress: async () => {
            try {
              const db = await dbAsync;

              // Wipes all rows out of your SQLite table
              await db.runAsync("DELETE FROM songs");

              // Delete the raw files from the storage folder path
              const appDirectory = FileSystem.documentDirectory;
              if (appDirectory) {
                const files = await FileSystem.readDirectoryAsync(appDirectory);
                for (const fileName of files) {
                  await FileSystem.deleteAsync(`${appDirectory}${fileName}`, {
                    idempotent: true,
                  });
                }
              }

              Alert.alert(
                "Clean Slate ✨",
                "All files and database rows successfully erased!",
              );
              calculateDiagnosticMetrics(); // Refresh dashboard instantly
            } catch (error) {
              console.error("Failed to complete system wipe:", error);
            }
          },
        },
      ],
    );
  };

  const extractEmbeddedArtwork = async (
    uri: string,
    songId: string,
  ): Promise<string | null> => {
    try {
      const base64File = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileBuffer = Buffer.from(base64File, "base64");

      const metadata = await parseBuffer(fileBuffer);
      const picture = metadata.common.picture?.[0];
      if (!picture) return null; // No cover art embedded

      const base64Data = Buffer.from(picture.data).toString("base64");
      const artPath = `${FileSystem.documentDirectory}${songId}_cover.jpg`;

      await FileSystem.writeAsStringAsync(artPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });

      return artPath;
    } catch (err) {
      console.log("ℹ️ No embedded artwork or failed to parse:", err);
      return null;
    }
  };

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
      const targetAsset = selectedFile.assets[0];
      const appStorageDirectory =
        FileSystem.documentDirectory || FileSystem.cacheDirectory;

      if (!appStorageDirectory) {
        throw new Error("Application storage sandbox path is unavailable.");
      }

      const cleanFileName = targetAsset.name.replace(/\s+/g, "_");
      const permanentFilePath = `${appStorageDirectory}${cleanFileName}`;

      await FileSystem.copyAsync({
        from: targetAsset.uri,
        to: permanentFilePath,
      });

      const cleanTitle = targetAsset.name
        .replace(/\.(mp3|m4a|wav|flac)$/i, "")
        .replace(/_/g, " ");
      const uniqueSongId = `user_track_${Date.now()}`;

      // ✨ Dynamically calculate true track duration in milliseconds
      let exactDurationMillis = 0;
      try {
        const { sound, status } = await Audio.Sound.createAsync(
          { uri: permanentFilePath },
          { shouldPlay: false },
        );

        if (status.isLoaded && status.durationMillis) {
          exactDurationMillis = status.durationMillis;
        }
        await sound.unloadAsync();
      } catch (durationErr) {
        console.warn("Could not determine duration on import:", durationErr);
      }

      const extractedArtPath = await extractEmbeddedArtwork(
        permanentFilePath,
        uniqueSongId,
      );

      const db = await dbAsync;
      await db.runAsync(
        `INSERT INTO songs (id, file_path, title, artist, album, genre, duration, custom_artwork_path) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          uniqueSongId,
          permanentFilePath,
          cleanTitle,
          "Imported Track",
          "My Files",
          "Local",
          exactDurationMillis, // ✨ Real computed duration saved here!
          extractedArtPath,
        ],
      );

      setIsImporting(false);
      Alert.alert(
        "Success 🎉",
        `"${cleanTitle}" added to your library! Check your Library tab.`,
      );
      calculateDiagnosticMetrics(); // Refresh stats after importing!
    } catch (error) {
      console.error("❌ Failed to pick or import audio track:", error);
      setIsImporting(false);
      Alert.alert("Error", "Could not complete audio file import.");
    }
  };

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollPadding}
    >
      <Text style={[styles.title, { color: colors.text }]}>App Settings</Text>

      {/* User Section Controls */}
      <View
        style={[
          styles.settingRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.settingMeta}>
          <Ionicons name="moon-outline" size={22} color={colors.text} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Dark Mode
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

      <View
        style={[
          styles.settingRow,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.settingMeta}>
          <Ionicons name="cloud-upload-outline" size={22} color={colors.text} />
          <Text style={[styles.settingLabel, { color: colors.text }]}>
            Import Music Track
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

      {/* --- HIDDEN CORE DEVELOPER DIAGNOSTIC PANEL --- */}
      <Text style={[styles.devHeading, { color: colors.textSecondary }]}>
        🛠️ Developer Diagnostics
      </Text>

      <View
        style={[
          styles.devPanel,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Indexed SQL Rows:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {dbSongCount} Tracks
          </Text>
        </View>

        <View style={styles.metricItem}>
          <Text style={[styles.metricLabel, { color: colors.textSecondary }]}>
            Sandbox Disk Weight:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {storageSizeMB} MB
          </Text>
        </View>

        {/* The Power Nuke Button */}
        <TouchableOpacity
          style={styles.nukeButton}
          onPress={handleNukeDatabaseCache}
          activeOpacity={0.8}
        >
          <Ionicons name="trash-bin-outline" size={16} color="#FFFFFF" />
          <Text style={styles.nukeButtonText}>Nuke Cache & Data</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  scrollPadding: {
    padding: 20,
    paddingBottom: 140,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 24,
    marginTop: 10,
  },
  settingRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 14,
    borderWidth: 1,
    marginBottom: 16,
  },
  settingMeta: {
    flexDirection: "row",
    alignItems: "center",
  },
  settingLabel: {
    fontSize: 16,
    fontWeight: "500",
    marginLeft: 12,
  },
  toggleButton: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
  toggleButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    fontSize: 12,
  },
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

  // Dev Styles
  devHeading: {
    fontSize: 13,
    fontWeight: "700",
    textTransform: "uppercase",
    letterSpacing: 1,
    marginTop: 24,
    marginBottom: 12,
    paddingHorizontal: 4,
  },
  devPanel: {
    padding: 16,
    borderRadius: 16,
    borderWidth: 1,
    borderStyle: "dashed",
  }, // Dashed border indicates engineering wireframes
  metricItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  metricLabel: { fontSize: 14, fontWeight: "500" },
  metricValue: { fontSize: 14, fontWeight: "700" },
  nukeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 10,
    marginTop: 8,
  },
  nukeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 13,
  },
});
