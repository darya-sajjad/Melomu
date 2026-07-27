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
    onClose();
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
        <View
          style={[
            styles.modalBox,
            {
              backgroundColor: colors.surface,
              borderColor: colors.primary,
              marginBottom: 425,
            },
          ]}
        >
          <Pressable onPress={(e) => e.stopPropagation()}>
            <Text style={[styles.title, { color: colors.text }]}>
              Edit {type === "album" ? "Album" : "Artist"} ({count} songs)
            </Text>

            <TextInput
              style={[
                styles.input,
                {
                  color: colors.text,
                  borderColor: colors.primary,
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
                  },
                ]}
                disabled={!value.trim()}
                onPress={handleSave}
              >
                <Text style={styles.saveText}>Save</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "flex-end",
    alignItems: "center",
    paddingHorizontal: 20,
  },
  modalBox: {
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
    fontSize: 16,
    fontWeight: "600",
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
    fontWeight: "600",
    color: "#ffffff",
  },
});
