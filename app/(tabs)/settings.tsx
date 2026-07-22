import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useIsFocused } from "@react-navigation/native";
import { Buffer } from "buffer";
import { Audio } from "expo-av";
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
  Switch,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

export default function SettingsScreen() {
  const { colors, theme, toggleTheme } = useTheme();
  const isFocused = useIsFocused();

  // State
  const [isImporting, setIsImporting] = useState(false);
  const [dbSongCount, setDbSongCount] = useState(0);
  const [storageSizeMB, setStorageSizeMB] = useState("0.0");

  // Local state for mock UI toggles from mockups
  const [gaplessPlayback, setGaplessPlayback] = useState(false);
  const [crossfade, setCrossfade] = useState(false);

  const calculateDiagnosticMetrics = async () => {
    try {
      const db = await dbAsync;

      // 1. Query live SQLite row counts
      const countResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs",
      );
      const totalSongs = countResult?.total || 0;
      setDbSongCount(totalSongs);

      // 2. Scan sandboxed storage directory
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
        setStorageSizeMB((totalBytes / (1024 * 1024)).toFixed(1));
      }
    } catch (error) {
      console.error("Failed to compile diagnostic metrics:", error);
    }
  };

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
              await db.runAsync("DELETE FROM songs");

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
              calculateDiagnosticMetrics();
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
      if (!picture) return null;

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
          exactDurationMillis,
          extractedArtPath,
        ],
      );

      setIsImporting(false);
      Alert.alert(
        "Success 🎉",
        `"${cleanTitle}" added to your library! Check your Library tab.`,
      );
      calculateDiagnosticMetrics();
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
      <Text style={[styles.screenHeaderTitle, { color: colors.text }]}>
        Settings
      </Text>

      {/* --- 1. APPEARANCE SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          APPEARANCE
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Dark Mode */}
        <View style={styles.rowItem}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Accent Color */}
        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Accent Color
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Auto from album art
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Now Playing Layout */}
        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Now Playing Layout
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Classic (art + controls)
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Theme Preset */}
        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Theme Preset
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              System Default
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* --- 2. PLAYBACK SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          PLAYBACK
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Gapless Playback */}
        <View style={styles.rowItem}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Gapless Playback
          </Text>
          <Switch
            value={gaplessPlayback}
            onValueChange={setGaplessPlayback}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Crossfade */}
        <View style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Crossfade
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              {crossfade ? "On (2s)" : "Off"}
            </Text>
          </View>
          <Switch
            value={crossfade}
            onValueChange={setCrossfade}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>
      </View>

      {/* --- 3. IMPORT & STORAGE --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          IMPORT & STORAGE
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={handleImportMusicTrack}
          disabled={isImporting}
        >
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Import Music Track
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Add local audio files to library
            </Text>
          </View>
          {isImporting ? (
            <ActivityIndicator size="small" color={colors.primary} />
          ) : (
            <Ionicons
              name="cloud-upload-outline"
              size={22}
              color={colors.primary}
            />
          )}
        </TouchableOpacity>
      </View>

      {/* --- 4. BACKUP & RESTORE SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          BACKUP & RESTORE
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Export Library Database
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Save .zip with all metadata + playlists
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Import Library Database
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Restore from backup file
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Export Playlists as .m3u
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Compatible with most players
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* --- 5. DEVELOPER DIAGNOSTICS --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          🛠️ DEVELOPER DIAGNOSTICS
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          styles.dashedCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.metricRow}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>
            Indexed SQL Rows:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {dbSongCount} Tracks
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>
            Sandbox Disk Weight:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {storageSizeMB} MB
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.nukeButton}
          onPress={handleNukeDatabaseCache}
        >
          <Ionicons name="trash-bin-outline" size={16} color="#FFFFFF" />
          <Text style={styles.nukeButtonText}>Nuke Cache & Data</Text>
        </TouchableOpacity>
      </View>

      {/* --- 6. ABOUT SECTION --- */}
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          ABOUT
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.rowItem}>
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Melomu Music Player
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              v1.0.0 (build 42) • MIT License
            </Text>
          </View>
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Open Source Licenses
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        <TouchableOpacity activeOpacity={0.7} style={styles.rowItem}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Send Feedback
          </Text>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
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
    paddingHorizontal: 16,
    paddingBottom: 170,
  },
  screenHeaderTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 10,
    textAlign: "center",
  },
  sectionHeader: {
    marginTop: 20,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  dashedCard: {
    borderStyle: "dashed",
    padding: 16,
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  nukeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  nukeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 14,
  },
});
