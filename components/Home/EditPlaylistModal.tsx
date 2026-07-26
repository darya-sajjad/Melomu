import placeholderIcon from "@/assets/icon.png";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import * as FileSystem from "expo-file-system/legacy";
import * as ImagePicker from "expo-image-picker";
import React, { useEffect, useState } from "react";
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

interface PlaylistMeta {
  id: string;
  name: string;
  artwork_path: string | null;
}

interface EditPlaylistModalProps {
  isVisible: boolean;
  playlist: PlaylistMeta | null;
  onClose: () => void;
  onSaved: (updated: { name: string; artwork_path: string | null }) => void;
}

export default function EditPlaylistModal({
  isVisible,
  playlist,
  onClose,
  onSaved,
}: EditPlaylistModalProps) {
  const { colors } = useTheme();
  const [name, setName] = useState("");
  const [artworkPath, setArtworkPath] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (playlist) {
      setName(playlist.name);
      setArtworkPath(playlist.artwork_path);
    }
  }, [playlist]);

  const handlePickCover = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) return;

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.7,
    });
    if (
      result.canceled ||
      !result.assets ||
      result.assets.length === 0 ||
      !playlist
    )
      return;

    const appStorageDirectory = FileSystem.documentDirectory;
    if (!appStorageDirectory) return;

    const destPath = `${appStorageDirectory}${playlist.id}_cover.jpg`;
    await FileSystem.copyAsync({ from: result.assets[0].uri, to: destPath });
    setArtworkPath(destPath);
  };

  const handleSave = async () => {
    const trimmedName = name.trim();
    if (!trimmedName || !playlist || isSaving) return;

    setIsSaving(true);
    try {
      const db = await dbAsync;
      await db.runAsync(
        "UPDATE playlists SET name = ?, artwork_path = ? WHERE id = ?",
        [trimmedName, artworkPath, playlist.id],
      );
      onSaved({ name: trimmedName, artwork_path: artworkPath });
      onClose();
    } catch (error) {
      console.error("Failed to update playlist:", error);
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
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <Text style={[styles.modalTitle, { color: colors.text }]}>
            Edit Playlist
          </Text>

          <TouchableOpacity
            onPress={handlePickCover}
            style={styles.coverPicker}
            activeOpacity={0.7}
          >
            <Image
              source={artworkPath ? { uri: artworkPath } : placeholderIcon}
              style={[
                styles.coverPreview,
                { backgroundColor: colors.background },
              ]}
            />
            <Text style={[styles.coverHint, { color: colors.textSecondary }]}>
              Change Cover Photo
            </Text>
          </TouchableOpacity>

          <Text style={[styles.inputLabel, { color: colors.text }]}>
            Playlist Name
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
            value={name}
            onChangeText={setName}
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
              onPress={handleSave}
              disabled={!name.trim() || isSaving}
              style={[
                styles.saveBtn,
                {
                  backgroundColor: colors.primary,
                },
              ]}
            >
              <Text style={styles.saveText}>
                {isSaving ? "Saving..." : "Save"}
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
    borderRadius: 25,
    padding: 24,
    borderWidth: 2,
    borderBottomWidth: 0,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 20,
  },
  coverPicker: {
    alignSelf: "center",
    alignItems: "center",
    marginBottom: 20,
  },
  coverPreview: {
    width: 90,
    height: 90,
    borderRadius: 14,
  },
  coverHint: {
    marginTop: 8,
    fontSize: 13,
    fontWeight: "600",
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
    paddingBottom: Platform.OS === "ios" ? 20 : 0,
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
