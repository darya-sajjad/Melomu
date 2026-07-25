import { useTheme } from "@/constants/ThemeContext";
import React, { useEffect, useState } from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface Props {
  visible: boolean;
  type: "album" | "artist" | null;
  count: number;
  onClose: () => void;
  onSubmit: (newValue: string) => void;
}

export default function BatchEditModal({
  visible,
  type,
  count,
  onClose,
  onSubmit,
}: Props) {
  const { colors } = useTheme();
  const [value, setValue] = useState("");

  useEffect(() => {
    if (visible) {
      setValue("");
    }
  }, [visible]);

  const handleClose = () => {
    onClose(); // Parent screen handles setting setIsSelectionModeActive(false)
  };

  const handleSave = () => {
    if (value.trim()) {
      onSubmit(value.trim());
      onClose();
    }
  };

  if (!type) return null;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
      statusBarTranslucent
    >
      <Pressable style={styles.overlay} onPress={handleClose}>
        <Pressable
          style={[
            styles.container,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
          onPress={(e) => e.stopPropagation()}
        >
          <Text style={[styles.title, { color: colors.text }]}>
            Edit {type === "album" ? "Album" : "Artist"} ({count} songs)
          </Text>

          <TextInput
            style={[
              styles.input,
              {
                color: colors.text,
                borderColor: colors.border,
                backgroundColor: colors.background,
              },
            ]}
            placeholder={`Enter new ${type} name...`}
            placeholderTextColor={colors.textSecondary}
            value={value}
            onChangeText={setValue}
            autoFocus
          />

          <View style={styles.btnRow}>
            <TouchableOpacity
              style={[styles.btn, styles.cancelBtn]}
              onPress={handleClose}
            >
              <Text style={{ color: colors.textSecondary }}>Cancel</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.btn,
                {
                  backgroundColor: colors.primary,
                  opacity: value.trim() ? 1 : 0.5,
                },
              ]}
              disabled={!value.trim()}
              onPress={handleSave}
            >
              <Text style={styles.saveText}>Save</Text>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  container: {
    width: "100%",
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
    elevation: 12,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 16,
  },
  input: {
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    paddingHorizontal: 14,
    fontSize: 15,
    marginBottom: 20,
  },
  btnRow: {
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 12,
  },
  btn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  cancelBtn: {
    backgroundColor: "transparent",
  },
  saveText: {
    color: "#FFFFFF",
    fontWeight: "600",
  },
});
