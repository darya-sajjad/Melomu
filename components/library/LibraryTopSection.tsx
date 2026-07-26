import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef, useState } from "react";
import {
  Keyboard,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

interface LibrarytopSectionProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onSelectMultipleToDelete?: () => void;
  onSelectMultipleToEditAlbum?: () => void;
  onSelectMultipleToEditArtist?: () => void;
}

export function LibraryTopSection({
  searchQuery,
  setSearchQuery,
  onSelectMultipleToDelete,
  onSelectMultipleToEditAlbum,
  onSelectMultipleToEditArtist,
}: LibrarytopSectionProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  const handleOptionPress = (action?: () => void) => {
    setIsMenuOpen(false);
    if (action) {
      action();
    }
  };

  return (
    <View style={styles.topRowContainer}>
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.background,
            borderColor: colors.primary,
          },
        ]}
      >
        <Ionicons
          name="search-outline"
          size={18}
          color={colors.textSecondary}
          style={styles.searchIcon}
        />

        <TextInput
          ref={inputRef}
          style={[styles.searchInput, { color: colors.text }]}
          placeholder="Search library..."
          placeholderTextColor={colors.textSecondary}
          value={searchQuery}
          onChangeText={setSearchQuery}
          autoCorrect={false}
        />

        {searchQuery.length > 0 && (
          <Pressable
            onPress={handleClear}
            hitSlop={8}
            style={styles.closeButton}
          >
            <Ionicons
              name="close-circle"
              size={20}
              color={colors.textSecondary}
            />
          </Pressable>
        )}
      </View>

      <TouchableOpacity
        style={[
          styles.menuButton,
          {
            backgroundColor: colors.primary,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => setIsMenuOpen(true)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.texttwo} />
      </TouchableOpacity>
      <Modal
        visible={isMenuOpen}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setIsMenuOpen(false)}
      >
        <Pressable
          style={styles.modalOverlay}
          onPress={() => setIsMenuOpen(false)}
        >
          <View
            style={[
              styles.dropdownMenu,
              {
                backgroundColor: colors.surface,
              },
            ]}
          >
            <Text
              style={[styles.menuHeader, { color: colors.text, opacity: 0.7 }]}
            >
              Actions
            </Text>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(onSelectMultipleToEditAlbum)}
            >
              <Ionicons
                name="disc-outline"
                size={20}
                color={colors.text}
                style={styles.menuIcon}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                  Album Name
                </Text>
                <Text
                  style={[
                    styles.menuItemSubtitle,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
                  Edit album name
                </Text>
              </View>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(onSelectMultipleToEditArtist)}
            >
              <Ionicons
                name="person-outline"
                size={20}
                color={colors.text}
                style={styles.menuIcon}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemTitle, { color: colors.text }]}>
                  Artist Name
                </Text>
                <Text
                  style={[
                    styles.menuItemSubtitle,
                    { color: colors.text, opacity: 0.7 },
                  ]}
                >
                  Edit artist name
                </Text>
              </View>
            </TouchableOpacity>

            <View
              style={[
                styles.divider,
                { backgroundColor: colors.active, opacity: 0.7 },
              ]}
            />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(onSelectMultipleToDelete)}
            >
              <Ionicons
                name="list-outline"
                size={20}
                color={colors.active}
                style={styles.menuIcon}
              />
              <View style={styles.menuItemTextContainer}>
                <Text style={[styles.menuItemTitle, { color: colors.active }]}>
                  Select Songs
                </Text>
                <Text
                  style={[
                    styles.menuItemSubtitle,
                    { color: colors.active, opacity: 0.7 },
                  ]}
                >
                  Add to Playlist or Delete
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  topRowContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginHorizontal: 16,
    marginVertical: 10,
    gap: 10,
  },
  searchBar: {
    flex: 1,
    height: 44,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 14,
    overflow: "hidden",
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    fontSize: 15,
    paddingVertical: 0,
  },
  closeButton: {
    marginLeft: 6,
  },
  menuButton: {
    width: 44,
    height: 44,
    borderRadius: 24,
    borderWidth: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
    justifyContent: "flex-start",
    alignItems: "flex-end",
    paddingTop: 80,
    paddingRight: 18,
  },
  dropdownMenu: {
    width: 187,
    marginRight: -2,
    borderRadius: 16,
    paddingVertical: 10,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  menuHeader: {
    fontSize: 11,
    fontWeight: "700",
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.6,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "flex-start",
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
    marginTop: 2,
  },
  menuItemTextContainer: {
    flex: 1,
  },
  menuItemTitle: {
    fontSize: 14,
    fontWeight: "600",
  },
  menuItemSubtitle: {
    fontSize: 12,
    fontWeight: "400",
    marginTop: 2,
  },
  divider: {
    height: 1,
    marginVertical: 8,
    marginHorizontal: 12,
  },
});
