import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { fetchAndCacheLyrics } from "@/constants/LyricsService";
import { useTheme } from "@/constants/ThemeContext";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface Song {
  id: string;
  title: string;
  artist: string;
  album?: string;
  custom_artwork_path?: string | null;
}

interface EditMetaModalProps {
  isVisible: boolean;
  song: Song | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
    maxHeight: "65%",
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
    marginBottom: 6,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 16,
    fontSize: 15,
    marginBottom: 16,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: 20,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: {
    fontSize: 15,
    fontWeight: "600",
  },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: {
    color: "#FFFFFF",
    fontSize: 15,
    fontWeight: "600",
  },
});

export default function EditMetaModal({
  isVisible,
  song,
  onClose,
  onSaveSuccess,
}: EditMetaModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [album, setAlbum] = useState("");
  const [artworkPath, setArtworkPath] = useState<string | null>(null);
  const [isArtworkManuallySet, setIsArtworkManuallySet] = useState(false);

  useEffect(() => {
    if (song) {
      setTitle(song.title || "");
      setArtist(song.artist || "");
      setAlbum(song.album || "");
      setArtworkPath(song.custom_artwork_path || null);
      setIsArtworkManuallySet(false);
    }
  }, [song]);

  const handlePickCoverImage = async () => {
    try {
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Denied",
          "Melomu needs access to your gallery to change album art.",
        );
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        aspect: [1, 1],
        quality: 0.7,
      });

      if (
        result.canceled ||
        !song ||
        !result.assets ||
        result.assets.length === 0
      )
        return;

      const appStorageDirectory = FileSystem.documentDirectory;
      if (!appStorageDirectory) return;

      const destPath = `${appStorageDirectory}${song.id}_custom_cover.jpg`;

      await FileSystem.copyAsync({
        from: result.assets[0].uri,
        to: destPath,
      });

      setArtworkPath(destPath);
      setIsArtworkManuallySet(true);
    } catch (error) {
      console.error("❌ Failed to select custom album art photo:", error);
    }
  };

  const handleSaveMetadata = async () => {
    if (!song || !title.trim()) return;

    const targetTitle = title.trim();
    const targetArtist = artist.trim();
    const targetAlbum = album.trim();

    try {
      const db = await dbAsync;

      await db.execAsync(`
        CREATE TABLE IF NOT EXISTS album_artworks (
          album TEXT PRIMARY KEY,
          artwork_path TEXT
        );
      `);

      let finalArtworkPath = artworkPath;
      if (!finalArtworkPath && targetAlbum) {
        const albumArt = await db.getFirstAsync<{ artwork_path: string }>(
          "SELECT artwork_path FROM album_artworks WHERE album = ?",
          [targetAlbum],
        );
        if (albumArt?.artwork_path) {
          finalArtworkPath = albumArt.artwork_path;
        }
      }

      const artworkSource = isArtworkManuallySet ? "manual" : "album";

      await db.runAsync(
        "UPDATE songs SET title = ?, artist = ?, album = ?, custom_artwork_path = ?, artwork_source = ? WHERE id = ?",
        [
          targetTitle,
          targetArtist,
          targetAlbum,
          finalArtworkPath,
          artworkSource,
          song.id,
        ],
      );

      console.log(`✏️ Saved metadata edits for: ${targetTitle}`);

      (async () => {
        try {
          await fetchAndCacheLyrics(song.id, targetTitle, targetArtist);
        } catch (fetchErr) {
          console.error("Background fetch loop failed:", fetchErr);
        }
      })();

      onSaveSuccess();
      onClose();
    } catch (error) {
      console.error("Failed to save song metadata edits:", error);
    }
  };

  return (
    <Modal
      visible={isVisible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <KeyboardAvoidingView
        behavior={
          Platform.OS === "ios" || Platform.OS === "android"
            ? "padding"
            : undefined
        }
        style={{ flex: 1 }}
      >
        <TouchableOpacity
          style={styles.overlay}
          activeOpacity={1}
          onPress={onClose}
        >
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalBox,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.border,
                },
              ]}
            >
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                Edit Song Info
              </Text>

              <ScrollView showsVerticalScrollIndicator={false}>
                <TouchableOpacity
                  onPress={handlePickCoverImage}
                  style={{
                    alignSelf: "center",
                    marginBottom: 20,
                    alignItems: "center",
                  }}
                  activeOpacity={0.7}
                >
                  <Image
                    source={
                      artworkPath ? { uri: artworkPath } : placeholderIcon
                    }
                    style={{
                      width: 100,
                      height: 100,
                      borderRadius: 14,
                      backgroundColor: colors.background,
                    }}
                  />
                  <Text
                    style={{
                      color: colors.textSecondary,
                      textAlign: "center",
                      marginTop: 8,
                      fontSize: 13,
                      fontWeight: "600",
                    }}
                  >
                    Change Cover Photo
                  </Text>
                </TouchableOpacity>

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Track Title
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={title}
                  onChangeText={setTitle}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Artist Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={artist}
                  onChangeText={setArtist}
                  placeholderTextColor={colors.textSecondary}
                />

                <Text style={[styles.inputLabel, { color: colors.text }]}>
                  Album Name
                </Text>
                <TextInput
                  style={[
                    styles.input,
                    {
                      backgroundColor: colors.background,
                      color: colors.text,
                      borderColor: colors.primary,
                    },
                  ]}
                  value={album}
                  onChangeText={setAlbum}
                  placeholderTextColor={colors.textSecondary}
                />
              </ScrollView>
              <View style={styles.buttonRow}>
                <TouchableOpacity onPress={onClose} style={styles.cancelBtn}>
                  <Text
                    style={[styles.cancelText, { color: colors.textSecondary }]}
                  >
                    Cancel
                  </Text>
                </TouchableOpacity>

                <TouchableOpacity
                  onPress={handleSaveMetadata}
                  style={[styles.saveBtn, { backgroundColor: colors.primary }]}
                >
                  <Text style={styles.saveText}>Save Changes</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </TouchableOpacity>
      </KeyboardAvoidingView>
    </Modal>
  );
}
