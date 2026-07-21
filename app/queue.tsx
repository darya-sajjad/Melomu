import placeholderIcon from "@/assets/icon.png";
import { useAudio } from "@/constants/AudioContext";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import React, { useState } from "react";
import {
  Image,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import DraggableFlatList, {
  RenderItemParams,
  ScaleDecorator,
} from "react-native-draggable-flatlist";
import { GestureHandlerRootView } from "react-native-gesture-handler";

export default function QueueScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const {
    queue,
    currentIndex,
    currentSong,
    playFromQueue,
    removeFromQueue,
    reorderQueue,
  } = useAudio();

  const [selectedIds, setSelectedIds] = useState<string[]>([]);

  // Split queue into upcoming items starting right after currentIndex
  const upcomingQueue = queue.slice(currentIndex + 1);

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id],
    );
  };

  const handleBatchRemove = () => {
    selectedIds.forEach((id) => {
      const idx = queue.findIndex((s) => s.id === id);
      if (idx !== -1) {
        removeFromQueue(idx);
      }
    });
    setSelectedIds([]);
  };

  const renderQueueItem = ({
    item,
    getIndex,
    drag,
    isActive,
  }: RenderItemParams<any>) => {
    const relIndex = getIndex();
    if (relIndex === undefined) return null;
    const actualIndex = currentIndex + 1 + relIndex;
    const isSelected = selectedIds.includes(item.id);

    return (
      <ScaleDecorator>
        <View
          style={[
            styles.trackRow,
            isActive && { backgroundColor: colors.surface, borderRadius: 10 },
          ]}
        >
          <TouchableOpacity
            onPress={() => toggleSelect(item.id)}
            style={styles.radioBtn}
          >
            <Ionicons
              name={isSelected ? "checkmark-circle" : "ellipse-outline"}
              size={22}
              color={isSelected ? colors.primary : colors.textSecondary}
            />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.trackMeta}
            onPress={() => playFromQueue(actualIndex)}
          >
            <Text
              style={[styles.trackTitle, { color: colors.text }]}
              numberOfLines={1}
            >
              {item.title}
            </Text>
            <Text
              style={[styles.trackArtist, { color: colors.textSecondary }]}
              numberOfLines={1}
            >
              {item.artist}
            </Text>
          </TouchableOpacity>

          {/* Drag Handle */}
          <TouchableOpacity
            onLongPress={drag}
            delayLongPress={100}
            style={styles.dragHandle}
          >
            <Ionicons
              name="reorder-two"
              size={26}
              color={colors.textSecondary}
            />
          </TouchableOpacity>
        </View>
      </ScaleDecorator>
    );
  };

  const renderHeader = () => (
    <View>
      <Text style={[styles.sectionTitleCenter, { color: colors.text }]}>
        Now Playing:
      </Text>

      {currentSong && (
        <View style={styles.nowPlayingCard}>
          <Image
            source={
              currentSong.custom_artwork_path
                ? { uri: currentSong.custom_artwork_path }
                : placeholderIcon
            }
            style={styles.nowPlayingArt}
          />
          <Text
            style={[styles.nowPlayingTitle, { color: colors.text }]}
            numberOfLines={1}
          >
            {currentSong.title}
          </Text>
          <Text
            style={[styles.nowPlayingArtist, { color: colors.textSecondary }]}
            numberOfLines={1}
          >
            {currentSong.artist}
          </Text>
        </View>
      )}

      <View style={styles.sectionHeaderRow}>
        <Text style={[styles.sectionHeading, { color: colors.text }]}>
          Next in queue:
        </Text>
        <TouchableOpacity
          style={[styles.clearBtn, { borderColor: colors.border }]}
          onPress={() => {
            for (let i = queue.length - 1; i > currentIndex; i--) {
              removeFromQueue(i);
            }
          }}
        >
          <Text style={[styles.clearBtnText, { color: colors.primary }]}>
            Clear Queue
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  return (
    <GestureHandlerRootView
      style={[styles.container, { backgroundColor: colors.background }]}
    >
      {/* Draggable Queue List */}
      <DraggableFlatList
        data={upcomingQueue}
        onDragEnd={({ from, to }) => {
          const actualFrom = currentIndex + 1 + from;
          const actualTo = currentIndex + 1 + to;
          reorderQueue(actualFrom, actualTo);
        }}
        keyExtractor={(item, idx) => `${item.id}-${idx}`}
        renderItem={renderQueueItem}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            No upcoming songs in queue.
          </Text>
        }
        contentContainerStyle={styles.scrollContent}
      />

      {/* Bottom Action Bar (Removed "Add to Queue") */}
      {selectedIds.length > 0 && (
        <View style={[styles.bottomBar, { borderTopColor: colors.border }]}>
          <TouchableOpacity onPress={handleBatchRemove}>
            <Text style={[styles.bottomBarAction, { color: colors.primary }]}>
              Remove ({selectedIds.length})
            </Text>
          </TouchableOpacity>
        </View>
      )}
    </GestureHandlerRootView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: Platform.OS === "ios" ? 50 : 30,
  },
  iconBtn: {
    padding: 6,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 100,
  },
  sectionTitleCenter: {
    fontSize: 16,
    fontWeight: "600",
    textAlign: "center",
    marginTop: 10,
    marginBottom: 16,
  },
  nowPlayingCard: {
    alignItems: "center",
    marginBottom: 28,
  },
  nowPlayingArt: {
    width: 140,
    height: 140,
    borderRadius: 16,
    marginBottom: 14,
  },
  nowPlayingTitle: {
    fontSize: 18,
    fontWeight: "700",
    marginBottom: 4,
  },
  nowPlayingArtist: {
    fontSize: 14,
  },
  sectionHeaderRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 16,
  },
  sectionHeading: {
    fontSize: 16,
    fontWeight: "600",
  },
  clearBtn: {
    borderWidth: 1,
    borderRadius: 18,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  clearBtnText: {
    fontSize: 12,
    fontWeight: "600",
  },
  trackRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    paddingHorizontal: 8,
  },
  radioBtn: {
    paddingRight: 12,
  },
  trackMeta: {
    flex: 1,
  },
  trackTitle: {
    fontSize: 15,
    fontWeight: "600",
    marginBottom: 2,
  },
  trackArtist: {
    fontSize: 12,
  },
  dragHandle: {
    paddingLeft: 12,
    paddingVertical: 6,
  },
  emptyText: {
    fontSize: 14,
    textAlign: "center",
    marginVertical: 20,
  },
  bottomBar: {
    position: "absolute",
    bottom: 30,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    paddingHorizontal: 28,
    paddingVertical: 18,
    backgroundColor: "rgba(0,0,0,0.85)",
  },
  bottomBarAction: {
    fontSize: 15,
    fontWeight: "700",
  },
});
