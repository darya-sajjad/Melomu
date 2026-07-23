import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface ImportStorageSectionProps {
  onScanFolder: () => void;
  isScanning: boolean;
}

export default function ImportStorageSection({
  onScanFolder,
  isScanning,
}: ImportStorageSectionProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          IMPORT & STORAGE
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Scan Music Folder */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={onScanFolder}
          disabled={isScanning}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Scan Music Folder
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Select a directory to auto-import all audio tracks
            </Text>
          </View>
          <Ionicons
            name="folder-open-outline"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>
      </View>
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
  rowTextGroup: {
    flex: 1,
    paddingRight: 10,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  rowSubtext: {
    fontSize: 13,
    marginTop: 2,
  },
});
