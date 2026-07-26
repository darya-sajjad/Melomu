import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import Constants from "expo-constants";
import React, { useState } from "react";
import {
  Alert,
  Linking,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";

const OPEN_SOURCE_LICENSES = [
  {
    name: "Expo AV",
    license: "MIT",
    description: "Audio playback & sound management",
  },
  {
    name: "Expo SQLite",
    license: "MIT",
    description: "Local database storage engine",
  },
  {
    name: "Expo File System",
    license: "MIT",
    description: "File reading & artwork caching",
  },
  {
    name: "music-metadata",
    license: "MIT",
    description: "ID3 & embedded cover art parser",
  },
  {
    name: "React Native",
    license: "MIT",
    description: "Cross-platform core framework",
  },
];

export default function AboutSection() {
  const { colors } = useTheme();
  const [showLicensesModal, setShowLicensesModal] = useState(false);

  const appVersion = Constants.expoConfig?.version || "1.0.0";
  const buildNumber = Constants.expoConfig?.android?.versionCode || "1";

  const handleOpenLink = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Could not open link.");
    });
  };

  const handleCheckForUpdates = () => {
    Alert.alert(
      "Melomu is Up to Date! ✨",
      `You are currently running the latest version (v${appVersion}).`,
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
          { backgroundColor: colors.surface, borderColor: colors.primary },
        ]}
      >
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={handleCheckForUpdates}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Version & Updates
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              v{appVersion} (Build {buildNumber}) • Tap to check updates
            </Text>
          </View>
          <Ionicons name="sparkles-outline" size={20} color={colors.primary} />
        </TouchableOpacity>

        <View style={[styles.divider, { backgroundColor: colors.surface }]} />

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

        <View style={[styles.divider, { backgroundColor: colors.surface }]} />

        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={() => setShowLicensesModal(true)}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Open Source Licenses
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              View libraries and attribution powering Melomu
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <Modal
        animationType="slide"
        visible={showLicensesModal}
        onRequestClose={() => setShowLicensesModal(false)}
      >
        <SafeAreaView
          style={[
            styles.modalContainer,
            { backgroundColor: colors.background },
          ]}
        >
          <View style={styles.modalHeader}>
            <Text style={[styles.modalTitle, { color: colors.text }]}>
              Open Source Libraries
            </Text>
            <TouchableOpacity onPress={() => setShowLicensesModal(false)}>
              <Ionicons name="close" size={26} color={colors.text} />
            </TouchableOpacity>
          </View>

          <View style={{ padding: 16 }}>
            {OPEN_SOURCE_LICENSES.map((item) => (
              <View
                key={item.name}
                style={[
                  styles.licenseCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.border,
                  },
                ]}
              >
                <View style={styles.licenseHeader}>
                  <Text style={[styles.libraryName, { color: colors.text }]}>
                    {item.name}
                  </Text>
                  <Text style={[styles.licenseTag, { color: colors.primary }]}>
                    {item.license}
                  </Text>
                </View>
                <Text
                  style={[styles.libraryDesc, { color: colors.textSecondary }]}
                >
                  {item.description}
                </Text>
              </View>
            ))}
          </View>
        </SafeAreaView>
      </Modal>
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
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingVertical: 16,
  },
  modalTitle: {
    fontSize: 19,
    fontWeight: "700",
  },
  licenseCard: {
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    marginBottom: 12,
  },
  licenseHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 4,
  },
  libraryName: {
    fontSize: 14,
    fontWeight: "600",
  },
  licenseTag: {
    fontSize: 12,
    fontWeight: "700",
  },
  libraryDesc: {
    fontSize: 13,
  },
});
