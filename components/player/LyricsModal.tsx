import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React from "react";
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";

interface Props {
  visible: boolean;
  songTitle: string;
  artist?: string;
  lyrics?: string | null;
  onClose: () => void;
}

export default function LyricsModal({
  visible,
  songTitle,
  artist,
  lyrics,
  onClose,
}: Props) {
  const { colors } = useTheme();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent={true}
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <View style={styles.lyricsModalWrapper}>
        <View
          style={[
            styles.lyricsHeaderNav,
            {
              backgroundColor: colors.background,
              height: insets.top + 56,
              paddingTop: insets.top + 8,
            },
          ]}
        >
          <TouchableOpacity
            onPress={onClose}
            activeOpacity={0.7}
            style={styles.backButtonTouchable}
          >
            <Ionicons name="chevron-down" size={28} color={colors.text} />
          </TouchableOpacity>
        </View>

        <View
          style={[
            styles.curvedLyricsCanvas,
            { backgroundColor: colors.surface, borderColor: colors.border },
          ]}
        >
          <View style={styles.panelMetaRow}>
            <Text
              style={[styles.panelSongTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {songTitle}
            </Text>
            <Text
              style={[styles.panelSongArtist, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {artist || "Unknown Artist"}
            </Text>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lyricsScrollContainer}
          >
            <Text style={[styles.figmaLyricsText, { color: colors.text }]}>
              {lyrics || "Searching for plain text lyrics lines..."}
            </Text>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  lyricsModalWrapper: {
    flex: 1,
    backgroundColor: "transparent",
  },
  lyricsHeaderNav: {
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    justifyContent: "center",
    alignItems: "flex-start",
  },
  curvedLyricsCanvas: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
  },
  panelMetaRow: {
    alignItems: "center",
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 28,
  },
  panelSongTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  panelSongArtist: {
    fontSize: 14,
    fontWeight: "500",
    textAlign: "center",
  },
  lyricsScrollContainer: {
    paddingHorizontal: 28,
    paddingTop: 16,
    paddingBottom: 80,
  },
  figmaLyricsText: {
    fontSize: 20,
    fontWeight: "700",
    lineHeight: 38,
    textAlign: "left",
    letterSpacing: -0.2,
  },
});
