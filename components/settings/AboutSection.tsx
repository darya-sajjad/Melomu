import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
    Linking,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";

interface AboutSectionProps {
  appVersion?: string;
  buildNumber?: string;
}

export default function AboutSection({
  appVersion = "1.0.0",
  buildNumber = "1",
}: AboutSectionProps) {
  const { colors } = useTheme();

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch((err) =>
      console.error("Failed to open URL:", err),
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          ABOUT MELOMU
        </Text>
      </View>

      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* App Version Row */}
        <View style={styles.rowItem}>
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Version
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              v{appVersion} (Build {buildNumber})
            </Text>
          </View>
          <Ionicons
            name="information-circle-outline"
            size={20}
            color={colors.textSecondary}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Developer / Project Info */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={() => handleOpenLink("https://github.com")}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Source Code & GitHub
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Check out project updates and report issues
            </Text>
          </View>
          <Ionicons name="logo-github" size={20} color={colors.text} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Licenses & Open Source Libraries */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={() => {
            // Optional: Route to a local modal/screen for open source licenses
          }}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Open Source Licenses
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Libraries powering Melomu
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 24,
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
