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
      action(); // Call the parent handler directly without side-effects
    }
  };

  return (
    <View style={styles.topRowContainer}>
      {/* Search Bar */}
      <View
        style={[
          styles.searchBar,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
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

      {/* Options Menu Button */}
      <TouchableOpacity
        style={[
          styles.menuButton,
          {
            backgroundColor: colors.surface,
            borderColor: colors.border,
          },
        ]}
        activeOpacity={0.7}
        onPress={() => setIsMenuOpen(true)}
      >
        <Ionicons name="ellipsis-vertical" size={20} color={colors.text} />
      </TouchableOpacity>

      {/* Options Modal */}
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
                borderColor: colors.border,
              },
            ]}
          >
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
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Edit Album Name
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

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
              <Text style={[styles.menuItemText, { color: colors.text }]}>
                Edit Artist Name
              </Text>
            </TouchableOpacity>

            <View
              style={[styles.divider, { backgroundColor: colors.border }]}
            />

            <TouchableOpacity
              style={styles.menuItem}
              activeOpacity={0.7}
              onPress={() => handleOptionPress(onSelectMultipleToDelete)}
            >
              <Ionicons
                name="trash-outline"
                size={20}
                color="#E94560"
                style={styles.menuIcon}
              />
              <Text style={[styles.menuItemText, { color: "#E94560" }]}>
                Delete Songs
              </Text>
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
    height: 48,
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
    width: 48,
    height: 48,
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
    width: 200,
    borderRadius: 16,
    borderWidth: 1,
    paddingVertical: 6,
    elevation: 8,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
  },
  menuItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  menuIcon: {
    marginRight: 12,
  },
  menuItemText: {
    fontSize: 14,
    fontWeight: "500",
  },
  divider: {
    height: 1,
    marginHorizontal: 12,
  },
});
