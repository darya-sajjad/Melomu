import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { Alert, StyleSheet, Text, TouchableOpacity, View } from "react-native";

export default function BackupRestoreSection() {
  const { colors } = useTheme();

  const handleBackup = () => {
    Alert.alert(
      "Backup Unavailable",
      "Cloud backup requires custom native build credentials and is currently disabled in Expo Go.",
    );
  };

  const handleRestore = () => {
    Alert.alert(
      "Restore Unavailable",
      "Cloud restore requires custom native build credentials and is currently disabled in Expo Go.",
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          BACKUP & RESTORE
        </Text>
      </View>

      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Export / Backup Database */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={handleBackup}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Backup Library Data
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Export playlists, lyrics, and metadata
            </Text>
          </View>
          <Ionicons
            name="cloud-upload-outline"
            size={20}
            color={colors.primary}
          />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Import / Restore Database */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={handleRestore}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Restore Library Data
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Import previously saved backup file
            </Text>
          </View>
          <Ionicons
            name="cloud-download-outline"
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
  divider: {
    height: 1,
    width: "100%",
  },
});
