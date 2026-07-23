import { useTheme } from "@/constants/ThemeContext";
import React from "react";
import { ActivityIndicator, Modal, StyleSheet, Text, View } from "react-native";

interface ImportProgressModalProps {
  visible: boolean;
  currentTrackName: string;
  processedCount: number;
  totalCount: number;
}

export default function ImportProgressModal({
  visible,
  currentTrackName,
  processedCount,
  totalCount,
}: ImportProgressModalProps) {
  const { colors } = useTheme();

  const progressPercentage =
    totalCount > 0 ? Math.round((processedCount / totalCount) * 100) : 0;

  return (
    <Modal animationType="fade" transparent visible={visible}>
      <View style={styles.backdrop}>
        <View
          style={[
            styles.card,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <ActivityIndicator size="large" color={colors.primary} />

          <Text style={[styles.title, { color: colors.text }]}>
            Scanning Music Folder...
          </Text>

          <Text
            style={[styles.subtitle, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {currentTrackName || "Reading files..."}
          </Text>

          {/* Progress Bar Container */}
          <View
            style={[styles.progressBarBg, { backgroundColor: colors.border }]}
          >
            <View
              style={[
                styles.progressBarFill,
                {
                  backgroundColor: colors.primary,
                  width: `${progressPercentage}%`,
                },
              ]}
            />
          </View>

          <Text style={[styles.counterText, { color: colors.textSecondary }]}>
            {processedCount} / {totalCount > 0 ? totalCount : "..."} (
            {progressPercentage}%)
          </Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.65)",
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  card: {
    width: "100%",
    borderRadius: 20,
    padding: 24,
    alignItems: "center",
    borderWidth: 1,
  },
  title: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 16,
    marginBottom: 6,
  },
  subtitle: {
    fontSize: 13,
    marginBottom: 16,
    textAlign: "center",
    paddingHorizontal: 10,
  },
  progressBarBg: {
    width: "100%",
    height: 8,
    borderRadius: 4,
    overflow: "hidden",
    marginBottom: 10,
  },
  progressBarFill: {
    height: "100%",
    borderRadius: 4,
  },
  counterText: {
    fontSize: 12,
    fontWeight: "600",
  },
});
