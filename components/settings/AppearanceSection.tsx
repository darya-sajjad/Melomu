import ThemePresetModal, {
    ThemePresetOption,
} from "@/components/settings/ThemePresetModal";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

export default function AppearanceSection() {
  const { colors, theme, toggleTheme, activePreset, setActivePreset } =
    useTheme();
  const [presetModalVisible, setPresetModalVisible] = useState(false);

  const getPresetLabel = (preset: ThemePresetOption) => {
    switch (preset) {
      case "system":
        return "System Default";
      case "classic":
        return "Classic Melomu";
      case "oled":
        return "Pure Black (OLED)";
      case "midnight":
        return "Midnight Blue";
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          APPEARANCE
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Dark Mode */}
        <View style={styles.rowItem}>
          <Text style={[styles.rowTitle, { color: colors.text }]}>
            Dark Mode
          </Text>
          <Switch
            value={theme === "dark"}
            onValueChange={toggleTheme}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Theme Preset Trigger */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={() => setPresetModalVisible(true)}
        >
          <View>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Theme Preset
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              {getPresetLabel(activePreset)}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      {/* Preset Modal */}
      <ThemePresetModal
        visible={presetModalVisible}
        selectedPreset={activePreset}
        onSelectPreset={setActivePreset}
        onClose={() => setPresetModalVisible(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 10,
  },
  sectionHeader: {
    marginTop: 10,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  sectionHeaderText: {
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 0.8,
  },
  cardContainer: {
    borderRadius: 16,
    borderWidth: 1,
    overflow: "hidden",
  },
  rowItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
  divider: {
    height: 1,
    width: "100%",
  },
});
