import { dbAsync } from "@/constants/Database";
import { fetchAndCacheLyrics } from "@/constants/LyricsService"; // Ensure this is imported cleanly
import { useTheme } from "@/constants/ThemeContext";
import React, { useEffect, useState } from "react";
import {
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

  useEffect(() => {
    if (song) {
      setTitle(song.title);
      setArtist(song.artist || "");
    }
  }, [song]);

  const handleSaveMetadata = async () => {
    if (!song || !title.trim()) return;

    const targetTitle = title.trim();
    const targetArtist = artist.trim();

    try {
      const db = await dbAsync;

      // 1. Update our SQLite virtual data fields instantly
      await db.runAsync("UPDATE songs SET title = ?, artist = ? WHERE id = ?", [
        targetTitle,
        targetArtist,
        song.id,
      ]);

      console.log(`✏️ Saved virtual metadata for: ${targetTitle}`);

      // 2. FORCE TRIGGER THE SCRAEPER LOOP OUT LOUD
      // Running it inside an async IIFE guarantees the background network request doesn't get ignored
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
