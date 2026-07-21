import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useState } from "react";
import {
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

interface CreatePlaylistModalProps {
  isVisible: boolean;
  onClose: () => void;
  onCreated: () => void;
}

export default function CreatePlaylistModal({
  isVisible,
  onClose,
  onCreated,
}: CreatePlaylistModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [pickedCoverUri, setPickedCoverUri] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const resetAndClose = () => {
    setName("");
    setPickedCoverUri(null);
    onClose();
  };

  const handlePickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });

    if (result.canceled || !result.assets || result.assets.length === 0) return;
    setPickedCoverUri(result.assets[0].uri);
  };

  const handleCreate = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || isSaving) return;

    setIsSaving(true);
    try {
      const db = await dbAsync;
      const newPlaylistId = `playlist_${Date.now()}`;

      let savedArtworkPath: string | null = null;
      if (pickedCoverUri) {
        const appStorageDirectory = FileSystem.documentDirectory;
        if (appStorageDirectory) {
          const destPath = `${appStorageDirectory}${newPlaylistId}_cover.jpg`;
          await FileSystem.copyAsync({ from: pickedCoverUri, to: destPath });
          savedArtworkPath = destPath;
        }
      }

      await db.runAsync(
        "INSERT INTO playlists (id, name, artwork_path, created_at) VALUES (?, ?, ?, ?)",
        [newPlaylistId, trimmedName, savedArtworkPath, Date.now()],
      );

      resetAndClose();
      onCreated();
    } catch (error) {
      console.error("Failed to create playlist:", error);
    } finally {
      setIsSaving(false);
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
            New Playlist
          </Text>

          <TouchableOpacity
            onPress={handlePickCover}
            style={styles.coverPicker}
            activeOpacity={0.7}
          >
            <Image
              source={
                pickedCoverUri ? { uri: pickedCoverUri } : placeholderIcon
              }
              style={[
                styles.coverPreview,
                { backgroundColor: colors.background },
              ]}
            />
            <Text style={[styles.coverHint, { color: colors.primary }]}>
              {pickedCoverUri
                ? "Change Cover Photo"
                : "Add Cover Photo (Optional)"}
            </Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>
            Playlist Name
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
            value={name}
            onChangeText={setName}
            placeholder="e.g. Road Trip"
            placeholderTextColor={colors.textSecondary}
            autoFocus
          />

          <View style={styles.buttonRow}>
            <TouchableOpacity onPress={resetAndClose} style={styles.cancelBtn}>
              <Text
                style={[styles.cancelText, { color: colors.textSecondary }]}
              >
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              onPress={handleCreate}
              disabled={!name.trim() || isSaving}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                  opacity: !name.trim() || isSaving ? 0.5 : 1,
                },
              ]}
            >
              <Text style={styles.saveText}>
                {isSaving ? "Creating..." : "Create"}
              </Text>
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
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
  },
  modalBox: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    borderWidth: 1,
    borderBottomWidth: 0,
  },
  modalTitle: { fontSize: 20, fontWeight: "700", marginBottom: 20 },
  coverPicker: { alignSelf: "center", alignItems: "center", marginBottom: 20 },
  coverPreview: { width: 90, height: 90, borderRadius: 14 },
  coverHint: { marginTop: 8, fontSize: 13, fontWeight: "600" },
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
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
  },
  cancelBtn: {
    flex: 1,
    height: 48,
    alignItems: "center",
    justifyContent: "center",
  },
  cancelText: { fontSize: 15, fontWeight: "600" },
  saveBtn: {
    flex: 2,
    height: 48,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  saveText: { color: "#FFFFFF", fontSize: 15, fontWeight: "600" },
});
