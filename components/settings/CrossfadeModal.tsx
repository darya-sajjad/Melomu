import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";

interface CrossfadeModalProps {
  visible: boolean;
  crossfadeDuration: number;
  onSelectDuration: (seconds: number) => void;
  onClose: () => void;
}

const DURATIONS = [0, 2, 4, 6, 8];

export default function CrossfadeModal({
  visible,
  crossfadeDuration,
  onSelectDuration,
  onClose,
}: CrossfadeModalProps) {
  const { colors } = useTheme();

  return (
    <Modal
      animationType="fade"
      transparent
      visible={visible}
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <View style={styles.backdrop}>
          <TouchableWithoutFeedback>
            <View
              style={[
                styles.modalCard,
                {
                  backgroundColor: colors.surface,
                  borderColor: colors.primary,
                },
              ]}
            >
              <View style={styles.headerRow}>
                <Text style={[styles.title, { color: colors.text }]}>
                  Crossfade Duration
                </Text>
                <TouchableOpacity onPress={onClose}>
                  <Ionicons
                    name="close"
                    size={24}
                    color={colors.textSecondary}
                  />
                </TouchableOpacity>
              </View>

              <Text
                style={[styles.description, { color: colors.textSecondary }]}
              >
                Smoothly fade between songs as they end and begin.
              </Text>

              {DURATIONS.map((seconds) => {
                const isSelected = crossfadeDuration === seconds;
                const label = seconds === 0 ? "Off" : `${seconds} Seconds`;

                return (
                  <TouchableOpacity
                    key={seconds}
                    activeOpacity={0.7}
                    style={[
                      styles.optionItem,
                      { borderTopColor: colors.primary },
                    ]}
                    onPress={() => {
                      onSelectDuration(seconds);
                      onClose();
                    }}
                  >
                    <Text style={[styles.optionLabel, { color: colors.text }]}>
                      {label}
                    </Text>

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
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
  },
  modalCard: {
    borderRadius: 20,
    padding: 20,
    marginHorizontal: 20,
    borderWidth: 2,
  },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 8,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
  },
  description: {
    fontSize: 13,
    marginBottom: 12,
  },
  optionItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 15,
    borderTopWidth: 1,
  },
  optionLabel: {
    fontSize: 15,
    fontWeight: "600",
  },
});
