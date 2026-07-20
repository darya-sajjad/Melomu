import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { fetchAndCacheLyrics } from "@/constants/LyricsService"; // Ensure this is imported cleanly
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
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Song {
  id: string;
  title: string;
  artist: string;
}

interface EditMetaModalProps {
  isVisible: boolean;
  song: Song | null;
  onClose: () => void;
  onSaveSuccess: () => void;
}

export default function EditMetaModal({
  isVisible,
  song,
  onClose,
  onSaveSuccess,
}: EditMetaModalProps) {
  const { colors } = useTheme();
  const [title, setTitle] = useState("");
  const [artist, setArtist] = useState("");
  const [artworkPath, setArtworkPath] = useState<string | null>(null);

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist || "");
      setArtworkPath((song as any).custom_artwork_path || null);
    }
  }, [song]);

  // ==========================================
  // ✨ PLACE THE handlePickCoverImage FUNCTION HERE (Step 2) ✨
  // ==========================================
  const handlePickCoverImage = async () => {
    try {
      // 1. Request user permission to access their photo library
      const permission =
        await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permission.granted) {
        Alert.alert(
          "Permission Denied",
          "Melomu needs access to your gallery to change album art.",
        );
        return;
      }

      // 2. Open up the smartphone photo selection window dashboard
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true, // Let them crop/square it cleanly!
        aspect: [1, 1], // ✨ FIXED: Added [1, 1] for a perfect square crop
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

      setArtworkPath(destPath); // Update local layout preview state instantly!
    } catch (error) {
      console.error("❌ Failed to select custom album art photo:", error);
    }
  };

  const handleSaveMetadata = async () => {
    if (!song || !title.trim()) return;

    const targetTitle = title.trim();
    const targetArtist = artist.trim();

    try {
      const db = await dbAsync;

      // ✨ UPDATED SQL QUERY (Step 3): Added "custom_artwork_path = ?" to update your database row
      await db.runAsync(
        "UPDATE songs SET title = ?, artist = ?, custom_artwork_path = ? WHERE id = ?",
        [
          targetTitle,
          targetArtist,
          artworkPath, // Pushes your new custom path string to SQLite
          song.id,
        ],
      );

      console.log(`✏️ Saved virtual metadata for: ${targetTitle}`);

      // 2. FORCE TRIGGER THE SCRAPER LOOP OUT LOUD
      (async () => {
        try {
          await fetchAndCacheLyrics(song.id, targetTitle, targetArtist);
        } catch (fetchErr) {
          console.error("Background fetch loop failed:", fetchErr);
        }
      })();

      onSaveSuccess(); // Refresh active UI screens
      onClose();
    } catch (error) {
      console.error("Failed to save song metadata edits:", error);
    }
  };

  return (
    <Modal visible={isVisible} animationType="slide" transparent>
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : "height"}
        style={styles.overlay}
      >
        <View
          style={[
            styles.modalBox,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Edit Song Info
          </Text>

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
              source={artworkPath ? { uri: artworkPath } : placeholderIcon}
              style={{
                width: 100,
                height: 100,
                borderRadius: 14,
                backgroundColor: colors.background,
              }}
            />
            <Text
              style={{
                color: colors.primary,
                textAlign: "center",
                marginTop: 8,
                fontSize: 13,
                fontWeight: "600",
              }}
            >
              Change Cover Photo
            </Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Track Title
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={title}
            onChangeText={setTitle}
            placeholderTextColor={colors.textSecondary}
          />

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Artist Name
          </Text>
          <TextInput
            style={[
              styles.input,
              {
                backgroundColor: colors.background,
                color: colors.text,
                borderColor: colors.border,
              },
            ]}
            value={artist}
            onChangeText={setArtist}
            placeholderTextColor={colors.textSecondary}
          />

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
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)", // Dark transparent backing shade
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
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
    marginBottom: 20,
  },
  buttonRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 10,
    paddingBottom: Platform.OS === "ios" ? 20 : 0, // Extra cushioning for iPhone home bar area
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
