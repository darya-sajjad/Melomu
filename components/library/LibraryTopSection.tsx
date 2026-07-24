import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import React, { useRef } from "react";
import { Keyboard, Pressable, StyleSheet, TextInput, View } from "react-native";

interface SearchDockProps {
  searchQuery: string;
  setSearchQuery: (query: string) => void;
}

export function SearchDock({ searchQuery, setSearchQuery }: SearchDockProps) {
  const { colors } = useTheme();
  const inputRef = useRef<TextInput>(null);

  const handleClear = () => {
    setSearchQuery("");
    inputRef.current?.blur();
    Keyboard.dismiss();
  };

  return (
    <View style={styles.dockWrapper}>
      <View
        style={[
          styles.expandedContainer,
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
    </View>
  );
}

const styles = StyleSheet.create({
  dockWrapper: {
    marginHorizontal: 16,
    marginVertical: 10,
    height: 48,
  },
  expandedContainer: {
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
});
