import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Modal,
    StyleSheet,
    Text,
    TouchableOpacity,
    TouchableWithoutFeedback,
    View,
} from "react-native";

export type ThemePresetOption = "system" | "classic" | "oled" | "midnight";

interface ThemePresetModalProps {
  visible: boolean;
  selectedPreset: ThemePresetOption;
  onSelectPreset: (preset: ThemePresetOption) => void;
  onClose: () => void;
}

const PRESETS: { id: ThemePresetOption; label: string; description: string }[] =
  [
    {
      id: "system",
      label: "System Default",
      description:
        "Matches your device's system dark/light theme automatically.",
    },
    {
      id: "classic",
      label: "Classic Melomu",
      description: "Standard clean theme tuned for day and night.",
    },
    {
      id: "oled",
      label: "High Contrast (OLED / Stark)",
      description:
        "Pitch black for dark mode or pure stark white for light mode.",
    },
    {
      id: "midnight",
      label: "Ocean / Daybreak Blue",
      description:
        "Deep oceanic blue undertones for night, soft sky blue for day.",
    },
  ];

export default function ThemePresetModal({
  visible,
  selectedPreset,
  onSelectPreset,
  onClose,
}: ThemePresetModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                { backgroundColor: colors.surface, borderColor: colors.border },
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Theme Presets
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              {PRESETS.map((preset) => {
                const isSelected = selectedPreset === preset.id;
                return (
                  <TouchableOpacity
                    key={preset.id}
                    activeOpacity={0.7}
                    style={[
                      styles.presetItem,
                      { borderTopColor: colors.border },
                    ]}
                    onPress={() => {
                      onSelectPreset(preset.id);
                      onClose();
                    }}
                  >
                    <View style={styles.presetTextGroup}>
                      <Text
                        style={[styles.presetLabel, { color: colors.text }]}
                      >
                        {preset.label}
                      </Text>
                      <Text
                        style={[
                          styles.presetDescription,
                          { color: colors.textSecondary },
                        ]}
                      >
                        {preset.description}
                      </Text>
                    </View>

                    {isSelected && (
                      <Ionicons
                        name="checkmark-circle"
                        size={22}
                        color={colors.primary}
                      />
                    )}
                  </TouchableOpacity>
                );
              })}
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    borderWidth: 1,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  presetItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 14,
    borderTopWidth: 1,
  },
  presetTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  presetLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
  presetDescription: {
    fontSize: 12,
    marginTop: 2,
  },
});
