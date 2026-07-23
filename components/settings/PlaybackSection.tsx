import CrossfadeModal from "@/components/settings/CrossfadeModal";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useState } from "react";
import { StyleSheet, Switch, Text, TouchableOpacity, View } from "react-native";

interface PlaybackSectionProps {
  gaplessPlayback: boolean;
  onToggleGapless: (val: boolean) => void;
  crossfadeDuration: number;
  onChangeCrossfade: (duration: number) => void;
}

export default function PlaybackSection({
  gaplessPlayback,
  onToggleGapless,
  crossfadeDuration,
  onChangeCrossfade,
}: PlaybackSectionProps) {
  const { colors } = useTheme();
  const [modalVisible, setModalVisible] = useState(false);

  return (
    <View style={styles.container}>
      <View style={styles.sectionHeader}>
        <Text
          style={[styles.sectionHeaderText, { color: colors.textSecondary }]}
        >
          PLAYBACK
        </Text>
      </View>
      <View
        style={[
          styles.cardContainer,
          { backgroundColor: colors.surface, borderColor: colors.border },
        ]}
      >
        {/* Gapless Playback Toggle */}
        <View style={styles.rowItem}>
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Gapless Playback
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              Seamless track transitions
            </Text>
          </View>
          <Switch
            value={gaplessPlayback}
            onValueChange={onToggleGapless}
            trackColor={{ false: colors.border, true: colors.primary }}
          />
        </View>

        <View style={[styles.divider, { backgroundColor: colors.border }]} />

        {/* Crossfade Selector */}
        <TouchableOpacity
          activeOpacity={0.7}
          style={styles.rowItem}
          onPress={() => setModalVisible(true)}
        >
          <View style={styles.rowTextGroup}>
            <Text style={[styles.rowTitle, { color: colors.text }]}>
              Crossfade
            </Text>
            <Text style={[styles.rowSubtext, { color: colors.textSecondary }]}>
              {crossfadeDuration > 0 ? `On (${crossfadeDuration}s)` : "Off"}
            </Text>
          </View>
          <Ionicons
            name="chevron-forward"
            size={18}
            color={colors.textSecondary}
          />
        </TouchableOpacity>
      </View>

      <CrossfadeModal
        visible={modalVisible}
        crossfadeDuration={crossfadeDuration}
        onSelectDuration={onChangeCrossfade}
        onClose={() => setModalVisible(false)}
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
