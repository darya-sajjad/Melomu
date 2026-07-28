import ImportProgressModal from "@/components/settings/ImportProgressModal";
import { dbAsync } from "@/constants/Database";
import { useTheme } from "@/constants/ThemeContext";
import { Ionicons } from "@expo/vector-icons";
import { Buffer } from "buffer";
import { Audio } from "expo-av";
import * as DocumentPicker from "expo-document-picker";
import * as FileSystem from "expo-file-system/legacy";
import { useNavigation, useRouter } from "expo-router";
import { parseBuffer } from "music-metadata";
import React, { useCallback, useEffect, useRef, useState } from "react";
import {
    Animated,
    Dimensions,
    StyleSheet,
    Text,
    TouchableOpacity,
    View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");

const FEATURES = [
  {
    icon: "color-palette-outline",
    title: "Themes",
    desc: "Customize colors and dark mode",
  },
  {
    icon: "library-outline",
    title: "Organize",
    desc: "Smart playlists and collections",
  },
  {
    icon: "musical-notes-outline",
    title: "Lyrics",
    desc: "Offline lyrics support",
  },
  {
    icon: "list-outline",
    title: "Queue",
    desc: "Build your perfect queue",
  },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const navigation = useNavigation();
  const { colors } = useTheme();

  useEffect(() => {
    navigation.setOptions({ headerShown: false });
  }, [navigation]);

  const scrollX = useRef(new Animated.Value(0)).current;
  const flatListRef = useRef<Animated.FlatList<any>>(null);
  const [currentIndex, setCurrentIndex] = useState(0);

  const [isImporting, setIsImporting] = useState(false);
  const [scanProgress, setScanProgress] = useState({
    currentTrack: "",
    processed: 0,
    total: 0,
  });
  const [importCompleted, setImportCompleted] = useState(false);

  const completeOnboarding = useCallback(async () => {
    try {
      await FileSystem.writeAsStringAsync(
        FileSystem.documentDirectory + "onboarding_complete.json",
        JSON.stringify({ completed: true, timestamp: Date.now() }),
      );
    } catch (e) {
      console.error("Failed to save onboarding flag:", e);
    }
    router.replace("/(tabs)/library");
  }, [router]);

  const scrollTo = (index: number) => {
    if (index >= 4) {
      completeOnboarding();
      return;
    }
    flatListRef.current?.scrollToIndex({ index, animated: true });
    setCurrentIndex(index);
  };

  const extractEmbeddedArtwork = async (
    uri: string,
    songId: string,
  ): Promise<string | null> => {
    try {
      const fileInfo = await FileSystem.getInfoAsync(uri);
      if (fileInfo.exists && (fileInfo.size as number) > 25 * 1024 * 1024)
        return null;

      const base64File = await FileSystem.readAsStringAsync(uri, {
        encoding: FileSystem.EncodingType.Base64,
      });
      const fileBuffer = Buffer.from(base64File, "base64");
      const metadata = await parseBuffer(fileBuffer);
      const picture = metadata.common.picture?.[0];
      if (!picture) return null;

      const base64Data = Buffer.from(picture.data).toString("base64");
      const artPath = `${FileSystem.documentDirectory}${songId}_cover.jpg`;
      await FileSystem.writeAsStringAsync(artPath, base64Data, {
        encoding: FileSystem.EncodingType.Base64,
      });
      return artPath;
    } catch {
      return null;
    }
  };

  const handleImportNow = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: "audio/*",
        multiple: true,
        copyToCacheDirectory: true,
      });

      if (result.canceled || !result.assets || result.assets.length === 0)
        return;

      const audioAssets = result.assets;
      setIsImporting(true);
      setScanProgress({
        currentTrack: "",
        processed: 0,
        total: audioAssets.length,
      });

      const appStorageDir =
        FileSystem.documentDirectory || FileSystem.cacheDirectory;
      if (!appStorageDir) throw new Error("Storage path unallocated.");

      const db = await dbAsync;

      for (let i = 0; i < audioAssets.length; i++) {
        const asset = audioAssets[i];
        const cleanFileName = asset.name.replace(/\s+/g, "_");
        const permanentPath = `${appStorageDir}${cleanFileName}`;

        setScanProgress({
          currentTrack: asset.name,
          processed: i + 1,
          total: audioAssets.length,
        });

        const existing: any = await db.getFirstAsync(
          "SELECT id FROM songs WHERE file_path = ?",
          [permanentPath],
        );

        if (!existing) {
          await FileSystem.copyAsync({
            from: asset.uri,
            to: permanentPath,
          });

          const cleanTitle = asset.name
            .replace(/\.(mp3|m4a|wav|flac|aac|ogg)$/i, "")
            .replace(/_/g, " ");
          const uniqueSongId = `scanned_track_${Date.now()}_${i}`;

          let exactDurationMillis = 0;
          try {
            const { sound, status } = await Audio.Sound.createAsync(
              { uri: permanentPath },
              { shouldPlay: false },
            );
            if (status.isLoaded && status.durationMillis) {
              exactDurationMillis = status.durationMillis;
            }
            await sound.unloadAsync();
          } catch {}

          const extractedArtPath = await extractEmbeddedArtwork(
            permanentPath,
            uniqueSongId,
          );

          await db.runAsync(
            `INSERT INTO songs (id, file_path, title, artist, album, duration, custom_artwork_path) VALUES (?, ?, ?, ?, ?, ?, ?)`,
            [
              uniqueSongId,
              permanentPath,
              cleanTitle,
              "Unknown Artist",
              "Scanned Folder",
              exactDurationMillis,
              extractedArtPath,
            ],
          );
        }
      }

      setIsImporting(false);
      setImportCompleted(true);
    } catch (error) {
      console.error("Import failed:", error);
      setIsImporting(false);
    }
  };

  const renderSlide = ({
    item,
    index,
  }: {
    item: { id: string };
    index: number;
  }) => {
    const inputRange = [
      (index - 1) * width,
      index * width,
      (index + 1) * width,
    ];
    const opacity = scrollX.interpolate({
      inputRange,
      outputRange: [0, 1, 0],
      extrapolate: "clamp",
    });
    const translateY = scrollX.interpolate({
      inputRange,
      outputRange: [20, 0, 20],
      extrapolate: "clamp",
    });

    let content;

    if (index === 0) {
      content = (
        <Animated.View
          style={[
            styles.slideContent,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="musical-notes" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>Melomu</Text>
          <Text style={[styles.subtitle, { color: colors.text }]}>
            Your music, your way.
          </Text>
          <Text style={[styles.body, { color: colors.textSecondary }]}>
            A premium offline music experience. Own your library, customize your
            vibe.
          </Text>
        </Animated.View>
      );
    } else if (index === 1) {
      content = (
        <Animated.View
          style={[
            styles.slideContent,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <Text style={[styles.title, { color: colors.primary }]}>
            Enjoy Premium Experience!
          </Text>
          <View style={styles.featuresGrid}>
            {FEATURES.map((f, i) => (
              <View
                key={i}
                style={[
                  styles.featureCard,
                  {
                    backgroundColor: colors.surface,
                    borderColor: colors.primary,
                  },
                ]}
              >
                <Ionicons
                  name={f.icon as any}
                  size={28}
                  color={colors.primary}
                />
                <Text style={[styles.featureTitle, { color: colors.text }]}>
                  {f.title}
                </Text>
                <Text style={[styles.featureDesc, { color: colors.texttwo }]}>
                  {f.desc}
                </Text>
              </View>
            ))}
          </View>
        </Animated.View>
      );
    } else if (index === 2) {
      content = (
        <Animated.View
          style={[
            styles.slideContent,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="folder-open" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            Bring Your Music
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                paddingHorizontal: 12,
              },
            ]}
          >
            Select your audio files to import them now. You can always do this
            later from Settings.
          </Text>

          {!importCompleted ? (
            <View style={styles.importButtons}>
              <TouchableOpacity
                onPress={handleImportNow}
                disabled={isImporting}
                style={[
                  styles.importButton,
                  { backgroundColor: colors.primary },
                ]}
              >
                <Text style={styles.buttonTextLight}>Import Now</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => scrollTo(3)}
                style={[styles.laterButton, { borderColor: colors.primary }]}
              >
                <Text
                  style={[styles.buttonTextDark, { color: colors.primary }]}
                >
                  Import Later
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <View style={styles.importDoneContainer}>
              <Ionicons
                name="checkmark-circle"
                size={44}
                color={colors.active}
              />
              <Text style={[styles.importDoneText, { color: colors.text }]}>
                Import Complete!
              </Text>
            </View>
          )}
        </Animated.View>
      );
    } else {
      content = (
        <Animated.View
          style={[
            styles.slideContent,
            { opacity, transform: [{ translateY }] },
          ]}
        >
          <View
            style={[styles.iconCircle, { backgroundColor: colors.surface }]}
          >
            <Ionicons name="checkmark" size={48} color={colors.primary} />
          </View>
          <Text style={[styles.title, { color: colors.primary }]}>
            You are All Set
          </Text>
          <Text
            style={[
              styles.body,
              {
                color: colors.textSecondary,
                textAlign: "center",
                paddingHorizontal: 12,
              },
            ]}
          >
            Your music journey begins now.
          </Text>
        </Animated.View>
      );
    }

    return (
      <View
        style={{
          width,
          flex: 1,
          justifyContent: "center",
          alignItems: "center",
          paddingHorizontal: 20,
        }}
      >
        {content}
      </View>
    );
  };

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: colors.background }]}
      edges={["top", "left", "right"]}
    >
      {!isImporting && currentIndex < 3 && (
        <TouchableOpacity
          onPress={completeOnboarding}
          style={styles.skipButton}
        >
          <Text style={[styles.skipText, { color: colors.textSecondary }]}>
            Skip
          </Text>
        </TouchableOpacity>
      )}

      <Animated.FlatList
        ref={flatListRef}
        data={[{ id: "1" }, { id: "2" }, { id: "3" }, { id: "4" }]}
        horizontal
        pagingEnabled
        scrollEnabled={!isImporting}
        showsHorizontalScrollIndicator={false}
        keyExtractor={(item) => item.id}
        renderItem={renderSlide}
        onScroll={Animated.event(
          [{ nativeEvent: { contentOffset: { x: scrollX } } }],
          { useNativeDriver: true },
        )}
        onMomentumScrollEnd={(e) => {
          const index = Math.round(e.nativeEvent.contentOffset.x / width);
          setCurrentIndex(index);
        }}
      />

      <View style={styles.footer}>
        <View style={styles.dotRow}>
          {[0, 1, 2, 3].map((i) => (
            <View
              key={i}
              style={[
                styles.dot,
                i === currentIndex && [
                  styles.activeDot,
                  { backgroundColor: colors.active },
                ],
                i !== currentIndex && {
                  backgroundColor: colors.border,
                },
              ]}
            />
          ))}
        </View>

        <TouchableOpacity
          onPress={() => scrollTo(currentIndex + 1)}
          style={[styles.nextButton, { backgroundColor: colors.primary }]}
        >
          <Text style={styles.nextButtonText}>
            {currentIndex === 3
              ? "Start Listening"
              : currentIndex === 2 && importCompleted
                ? "Continue"
                : "Next"}
          </Text>
        </TouchableOpacity>
      </View>

      <ImportProgressModal
        visible={isImporting}
        currentTrackName={scanProgress.currentTrack}
        processedCount={scanProgress.processed}
        totalCount={scanProgress.total}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    marginTop: 30,
  },
  skipButton: {
    position: "absolute",
    top: 18,
    right: 28,
    zIndex: 10,
    padding: 8,
  },
  skipText: {
    fontSize: 15,
    fontWeight: "500",
  },
  slideContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    width: width - 40,
  },
  iconCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  title: {
    fontSize: 28,
    fontWeight: "800",
    marginBottom: 12,
    textAlign: "center",
  },
  subtitle: {
    fontSize: 20,
    fontWeight: "600",
    marginBottom: 12,
    textAlign: "center",
  },
  body: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: "center",
    marginTop: 8,
  },
  featuresGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    width: "100%",
    marginTop: 24,
  },
  featureCard: {
    width: "47%",
    borderRadius: 16,
    borderWidth: 1,
    padding: 16,
    marginBottom: 16,
    alignItems: "center",
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: "700",
    marginTop: 10,
    marginBottom: 4,
  },
  featureDesc: {
    fontSize: 12,
    textAlign: "center",
    lineHeight: 18,
  },
  importButtons: {
    marginTop: 32,
    width: "100%",
    paddingHorizontal: 20,
  },
  importButton: {
    borderRadius: 14,
    paddingVertical: 10,
    alignItems: "center",
    marginBottom: 12,
  },
  laterButton: {
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    borderWidth: 1.5,
  },
  buttonTextLight: {
    color: "#f5f5f5",
    fontSize: 16,
    fontWeight: "700",
  },
  buttonTextDark: {
    fontSize: 16,
    fontWeight: "700",
  },
  importDoneContainer: {
    marginTop: 32,
    alignItems: "center",
  },
  importDoneText: {
    fontSize: 18,
    fontWeight: "700",
    marginTop: 12,
  },
  footer: {
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: "center",
  },
  dotRow: {
    flexDirection: "row",
    marginBottom: 24,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  activeDot: {
    width: 24,
    borderRadius: 4,
  },
  nextButton: {
    width: "100%",
    borderRadius: 14,
    paddingVertical: 16,
    alignItems: "center",
  },
  nextButtonText: {
    color: "#fcfcfc",
    fontSize: 17,
    fontWeight: "700",
  },
});
