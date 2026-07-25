import AboutSection from "@/components/settings/AboutSection";
import AppearanceSection from "@/components/settings/AppearanceSection";
import BackupRestoreSection from "@/components/settings/BackupRestoreSection";
import DeveloperDiagnosticsSection from "@/components/settings/DeveloperDiagnosticsSection";
import ImportProgressModal from "@/components/settings/ImportProgressModal";
import ImportStorageSection from "@/components/settings/ImportStorageSection";
import PlaybackSection from "@/components/settings/PlaybackSection";
import { useAudio } from "@/constants/AudioContext";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { useIsFocused } from "@react-navigation/native";
import { Buffer } from "buffer";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { parseBuffer } from "music-metadata";
import React, { useEffect, useState } from "react";
import { Alert, Platform, ScrollView, StyleSheet, Text } from "react-native";

export default function SettingsScreen() {
  const { colors } = useTheme();
  const isFocused = useIsFocused();
  const {
    gaplessPlayback,
    crossfadeDuration,
    setGaplessPlayback,
    setCrossfadeDuration,
  } = useAudio();

  const [isScanning, setIsScanning] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    currentTrack: "",
    processed: 0,
    total: 0,
  });
  const [dbSongCount, setDbSongCount] = useState(0);
  const [storageSizeMB, setStorageSizeMB] = useState("0.0");

  const extractEmbeddedArtwork = async (
    uri: string,
    songId: string,
  ): Promise<string | null> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && (fileInfo.size as number) > 25 * 1024 * 1024) {
        console.log("ℹ️ File too large for artwork extraction, skipping:", uri);
        return null;
      }

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

  const calculateDiagnosticMetrics = async () => {
    try {
      const db = await dbAsync;
      const countResult: any = await db.getFirstAsync(
        "SELECT COUNT(*) as total FROM songs",
      );
      const totalSongs = countResult?.total || 0;
      setDbSongCount(totalSongs);

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

  const handleBatchFolderScan = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0) {
        return;
      }

      const audioAssets = result.assets;
      setIsScanning(true);
      setScanProgress({
        currentTrack: "",
        processed: 0,
        total: audioAssets.length,
      });

      const appStorageDir =
        FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!appStorageDir) throw new Error("Storage path unallocated.");

      const db = await dbAsync;
      let importedCount = 0;

      for (let i = 0; i < audioAssets.length; i++) {
        const asset = audioAssets[i];
        const cleanFileName = asset.name.replace(/\s+/g, "_");
        const permanentPath = `${appStorageDir}${cleanFileName}`;

        setScanProgress({
          currentTrack: asset.name,
          processed: i + 1,
          total: audioAssets.length,
        });

        const existing: any = await db.getFirstAsync(
          "SELECT id FROM songs WHERE file_path = ?",
          [permanentPath],
        );

        if (!existing) {
          await FileSystem.copyAsync({
            from: asset.uri,
            to: permanentPath,
          });

          const cleanTitle = asset.name
            .replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, "")
            .replace(/_/g, " ");
          const uniqueSongId = `scanned_track_${Date.now()}_${i}`;

          let exactDurationMillis = 0;
          try {
            const { sound, status } = await Audio.Sound.createAsync(
              { uri: permanentPath },
              { shouldPlay: false },
            );
            if (status.isLoaded && status.durationMillis) {
              exactDurationMillis = status.durationMillis;
            }
            await sound.unloadAsync();
          } catch {
            // Duration fallback
          }

          const extractedArtPath = await extractEmbeddedArtwork(
            permanentPath,
            uniqueSongId,
          );

          await db.runAsync(
            `INSERT INTO songs (id, file_path, title, artist, album, duration, custom_artwork_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uniqueSongId,
              permanentPath,
              cleanTitle,
              "Unknown Artist",
              "Scanned Folder",
              exactDurationMillis,
              extractedArtPath,
            ],
          );
          importedCount++;
        }
      }

      setIsScanning(false);
      calculateDiagnosticMetrics();

      Alert.alert(
        "Scan Complete! 🎉",
        `Successfully added ${importedCount} new track(s) to your library.`,
      );
    } catch (error) {
      console.error("Folder scan failed:", error);
      setIsScanning(false);
      Alert.alert("Error", "Could not complete folder scan.");
    }
  };

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

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.scrollPadding}
    >
      <Text style={[styles.screenHeaderTitle, { color: colors.text }]}>
        Settings
      </Text>

      <AppearanceSection />

      <PlaybackSection
        gaplessPlayback={gaplessPlayback}
        onToggleGapless={setGaplessPlayback}
        crossfadeDuration={crossfadeDuration}
        onChangeCrossfade={setCrossfadeDuration}
      />

      <ImportStorageSection
        onScanFolder={handleBatchFolderScan}
        isScanning={isScanning}
      />

      <BackupRestoreSection />

      <DeveloperDiagnosticsSection
        dbSongCount={dbSongCount}
        storageSizeMB={storageSizeMB}
        onNuke={handleNukeDatabaseCache}
      />

      <AboutSection />

      <ImportProgressModal
        visible={isScanning}
        currentTrackName={scanProgress.currentTrack}
        processedCount={scanProgress.processed}
        totalCount={scanProgress.total}
      />
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
    paddingBottom: 140,
  },
  screenHeaderTitle: {
    fontSize: 26,
    fontWeight: "700",
    marginBottom: 16,
    marginTop: 10,
    textAlign: "center",
  },
});
