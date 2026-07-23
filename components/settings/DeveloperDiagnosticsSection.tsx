import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import { StyleSheet, Text, TouchableOpacity, View } from "react-native";

interface DeveloperDiagnosticsProps {
  dbSongCount: number;
  storageSizeMB: string;
  onNuke: () => void;
}

export default function DeveloperDiagnosticsSection({
  dbSongCount,
  storageSizeMB,
  onNuke,
}: DeveloperDiagnosticsProps) {
  const { colors } = useTheme();

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          🛠️ DEVELOPER DIAGNOSTICS
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          styles.dashedCard,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        <View style={styles.metricRow}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>
            Indexed SQL Rows:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {dbSongCount} Tracks
          </Text>
        </View>

        <View style={styles.metricRow}>
          <Text style={[styles.rowTitle, { color: colors.textSecondary }]}>
            Sandbox Disk Weight:
          </Text>
          <Text style={[styles.metricValue, { color: colors.text }]}>
            {storageSizeMB} MB
          </Text>
        </View>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.nukeButton}
          onPress={onNuke}
        >
          <Ionicons name="trash-bin-outline" size={16} color="#FFFFFF" />
          <Text style={styles.nukeButtonText}>Nuke Cache & Data</Text>
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
  dashedCard: {
    borderStyle: "dashed",
    padding: 16,
  },
  rowTitle: {
    fontSize: 15,
    fontWeight: "600",
  },
  metricRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 12,
  },
  metricValue: {
    fontSize: 15,
    fontWeight: "700",
  },
  nukeButton: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#D32F2F",
    paddingVertical: 12,
    borderRadius: 12,
    marginTop: 8,
  },
  nukeButtonText: {
    color: "#FFFFFF",
    fontWeight: "700",
    marginLeft: 6,
    fontSize: 14,
  },
});
