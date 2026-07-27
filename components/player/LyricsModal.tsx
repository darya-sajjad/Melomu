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
              height: insets.top,
              paddingTop: insets.top,
            },
          ]}
        />

        <View
          style={[
            styles.curvedLyricsCanvas,
            { backgroundColor: colors.surface, borderColor: colors.primary },
          ]}
        >
          <View style={styles.header}>
            <TouchableOpacity
              onPress={onClose}
              activeOpacity={0.7}
              style={styles.backButtonTouchable}
            >
              <Ionicons name="chevron-down" size={28} color={colors.text} />
            </TouchableOpacity>

            <View style={styles.panelMetaRow}>
              <View
                pointerEvents="none"
                style={{ width: "90%", overflow: "hidden" }}
              >
                <Text
                  style={[styles.panelSongTitle, { color: colors.text }]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {songTitle}
                </Text>
                <Text
                  style={[
                    styles.panelSongArtist,
                    { color: colors.textSecondary },
                  ]}
                  numberOfLines={1}
                  ellipsizeMode="tail"
                >
                  {artist || "Unknown Artist"}
                </Text>
              </View>
            </View>
            <View style={styles.headerRight} />
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.lyricsScrollContainer}
          >
            <Text style={[styles.figmaLyricsText, { color: colors.text }]}>
              {lyrics || "No lyrics found..."}
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
  header: {
    flexDirection: "row",
    alignItems: "center",
    height: 50,
    marginTop: 24,
    marginBottom: 20,
    paddingHorizontal: 12,
  },
  backButtonTouchable: {
    width: 44,
    height: 44,
    alignItems: "center",
    justifyContent: "center",
  },
  headerRight: {
    width: 44,
  },
  panelMetaRow: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  panelSongTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 2,
    textAlign: "center",
  },
  panelSongArtist: {
    fontSize: 12,
    fontWeight: "500",
    textAlign: "center",
  },
  lyricsHeaderNav: {
    justifyContent: "center",
  },
  curvedLyricsCanvas: {
    flex: 1,
    borderTopLeftRadius: 32,
    borderTopRightRadius: 32,
    borderWidth: 1,
    borderBottomWidth: 0,
    overflow: "hidden",
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
