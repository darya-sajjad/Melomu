import AsyncStorage from "@react-native-async-storage/async-storage";
import { Audio } from "expo-av";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { dbAsync } from "./Database";

export interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
  custom_artwork_path?: string | null;
  is_favorite?: number;
}

type RepeatMode = "off" | "one" | "all";

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentLyrics: string;
  shuffle: boolean;
  repeatMode: RepeatMode;
  queue: Song[];
  currentIndex: number;
  isFavorite: boolean;
  // ✨ Added Playback Settings Props
  gaplessPlayback: boolean;
  crossfadeDuration: number;
  setGaplessPlayback: (enabled: boolean) => Promise<void>;
  setCrossfadeDuration: (seconds: number) => Promise<void>;
  playSong: (song: Song, queueList?: Song[]) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  reloadLyrics: () => Promise<void>;
  seekTo: (millis: number) => Promise<void>;
  addToQueueNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (fromIndex: number, toIndex: number) => void;
  playFromQueue: (index: number) => Promise<void>;
  toggleFavorite: (songId?: string) => Promise<void>;
}

const AudioContext = createContext<AudioContextType>({} as AudioContextType);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [currentLyrics, setCurrentLyrics] = useState("");
  const [shuffle, setShuffle] = useState(false);
  const [repeatMode, setRepeatMode] = useState<RepeatMode>("off");

  const [gaplessPlayback, setGaplessState] = useState(false);
  const [crossfadeDuration, setCrossfadeState] = useState(0);

  const [queueState, setQueueState] = useState<Song[]>([]);
  const [currentIndexState, setCurrentIndexState] = useState<number>(-1);
  const [isFavorite, setIsFavorite] = useState<boolean>(false);

  const soundRef = useRef<Audio.Sound | null>(null);
  const nextSoundRef = useRef<Audio.Sound | null>(null);
  const isPreloadingRef = useRef<boolean>(false);
  const preloadedIndexRef = useRef<number>(-1);

  const originalQueueRef = useRef<Song[]>([]);
  const queueRef = useRef<Song[]>([]);
  const indexRef = useRef<number>(-1);
  const shuffleRef = useRef(shuffle);
  const repeatModeRef = useRef(repeatMode);
  const userQueueCountRef = useRef(0);

  // Synchronize internal refs with state for UI components
  const updateQueueState = (newQueue: Song[], newIndex: number) => {
    queueRef.current = newQueue;
    indexRef.current = newIndex;
    setQueueState([...newQueue]);
    setCurrentIndexState(newIndex);
  };

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  // Load saved gapless and crossfade settings from AsyncStorage
  useEffect(() => {
    const loadPlaybackSettings = async () => {
      try {
        const savedGapless = await AsyncStorage.getItem("setting-gapless");
        if (savedGapless !== null) {
          const setGaplessPlayback = async (enabled: boolean) => {
            setGaplessState(enabled);
            if (!enabled && nextSoundRef.current) {
              nextSoundRef.current.unloadAsync().catch(() => {});
              nextSoundRef.current = null;
              preloadedIndexRef.current = -1;
            }
            await AsyncStorage.setItem(
              "setting-gapless",
              JSON.stringify(enabled),
            );
          };
        }

        const savedCrossfade = await AsyncStorage.getItem("setting-crossfade");
        if (savedCrossfade !== null) {
          setCrossfadeState(Number(savedCrossfade));
        }
      } catch (err) {
        console.error("Failed to load playback settings:", err);
      }
    };
    loadPlaybackSettings();
  }, []);

  const setGaplessPlayback = async (enabled: boolean) => {
    setGaplessState(enabled);
    await AsyncStorage.setItem("setting-gapless", JSON.stringify(enabled));
  };

  const preloadNextTrack = async () => {
    const list = queueRef.current;
    if (!list.length || isPreloadingRef.current) return;

    const nextIndex = indexRef.current + 1;
    // Don't preload if out of bounds (unless repeat all is enabled)
    if (nextIndex >= list.length && repeatModeRef.current !== "all") return;

    const targetIndex = nextIndex >= list.length ? 0 : nextIndex;

    // Skip if already preloaded
    if (preloadedIndexRef.current === targetIndex && nextSoundRef.current)
      return;

    try {
      isPreloadingRef.current = true;

      // Clean up old preloaded instance if any
      if (nextSoundRef.current) {
        await nextSoundRef.current.unloadAsync();
        nextSoundRef.current = null;
      }

      const nextSong = list[targetIndex];

      // Create new sound instance in memory without starting playback
      const { sound } = await Audio.Sound.createAsync(
        { uri: nextSong.file_path },
        { shouldPlay: false, volume: 1.0 },
      );

      nextSoundRef.current = sound;
      preloadedIndexRef.current = targetIndex;
    } catch (err) {
      console.warn("⚠️ Gapless Preload Failed:", err);
    } finally {
      isPreloadingRef.current = false;
    }
  };

  const setCrossfadeDuration = async (seconds: number) => {
    setCrossfadeState(seconds);
    await AsyncStorage.setItem("setting-crossfade", seconds.toString());
  };

  // Synchronize isFavorite whenever currentSong changes
  useEffect(() => {
    if (currentSong) {
      setIsFavorite(Boolean(currentSong.is_favorite));
    } else {
      setIsFavorite(false);
    }
  }, [currentSong]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (soundRef.current) soundRef.current.unloadAsync().catch(() => {});
      if (nextSoundRef.current)
        nextSoundRef.current.unloadAsync().catch(() => {});
    };
  }, []);

  const shuffleArray = (arr: Song[]) => {
    const copy = [...arr];
    for (let i = copy.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [copy[i], copy[j]] = [copy[j], copy[i]];
    }
    return copy;
  };

  const buildShuffledQueue = (list: Song[], keep?: Song) => {
    if (!keep) return shuffleArray(list);
    const rest = list.filter((s) => s.id !== keep.id);
    return [keep, ...shuffleArray(rest)];
  };

  const loadOfflineCachedLyrics = async (songId: string) => {
    try {
      const db = await dbAsync;
      const cached: any = await db.getFirstAsync(
        "SELECT lyrics_text FROM lyrics_cache WHERE song_id = ?",
        [songId],
      );
      if (cached && cached.lyrics_text) {
        setCurrentLyrics(cached.lyrics_text);
      } else {
        setCurrentLyrics(
          "No lyrics loaded yet. Long-press this song in your Library tab to edit its details and trigger a search lookup!",
        );
      }
    } catch {
      setCurrentLyrics("");
    }
  };

  const fadeVolume = async (
    sound: Audio.Sound,
    fromVolume: number,
    toVolume: number,
    durationSeconds: number,
  ) => {
    if (durationSeconds <= 0) {
      await sound.setVolumeAsync(toVolume);
      return;
    }

    const steps = 10;
    const stepTime = (durationSeconds * 1000) / steps;
    const volumeStep = (toVolume - fromVolume) / steps;

    for (let i = 0; i <= steps; i++) {
      const targetVolume = Math.min(
        Math.max(fromVolume + volumeStep * i, 0),
        1,
      );
      try {
        await sound.setVolumeAsync(targetVolume);
      } catch (e) {
        // Ignore if sound was unmounted during fade
        break;
      }
      await new Promise((resolve) => setTimeout(resolve, stepTime));
    }
  };

  const loadAndPlayIndex = async (index: number) => {
    const list = queueRef.current;
    if (!list.length || index < 0 || index >= list.length) return;

    const song = list[index];
    updateQueueState(queueRef.current, index);

    try {
      const oldSound = soundRef.current;
      let soundToPlay: Audio.Sound;
      let usedPreload = false;

      // 1. Start the NEXT track first — this is the whole point of preloading.
      if (
        gaplessPlayback &&
        preloadedIndexRef.current === index &&
        nextSoundRef.current
      ) {
        soundToPlay = nextSoundRef.current;
        nextSoundRef.current = null;
        preloadedIndexRef.current = -1;
        usedPreload = true;
        await soundToPlay.playAsync();
      } else {
        // Discard a stale (wrong-index) preload if one exists
        if (nextSoundRef.current) {
          nextSoundRef.current.unloadAsync().catch(() => {});
          nextSoundRef.current = null;
          preloadedIndexRef.current = -1;
        }
        const initialVolume = crossfadeDuration > 0 ? 0.1 : 1.0;
        const { sound } = await Audio.Sound.createAsync(
          { uri: song.file_path },
          { shouldPlay: true, volume: initialVolume },
        );
        soundToPlay = sound;
      }

      soundRef.current = soundToPlay;
      setIsPlaying(true);
      setCurrentSong(song);
      setPosition(0);

      // 2. NOW clean up the old sound, without blocking playback of the new one.
      if (oldSound) {
        if (crossfadeDuration > 0 && isPlaying) {
          fadeVolume(oldSound, 1.0, 0.0, crossfadeDuration).then(() => {
            oldSound.unloadAsync().catch(() => {});
          });
        } else {
          oldSound.unloadAsync().catch(() => {});
        }
      }

      // Only fade the new track in if we're not gapless-preloaded at full volume already
      if (crossfadeDuration > 0 && !usedPreload) {
        fadeVolume(soundToPlay, 0.1, 1.0, crossfadeDuration);
      }

      await loadOfflineCachedLyrics(song.id);

      soundToPlay.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis);
        if (status.durationMillis) setDuration(status.durationMillis);

        if (
          gaplessPlayback &&
          repeatModeRef.current !== "one" &&
          status.durationMillis &&
          status.positionMillis / status.durationMillis > 0.85
        ) {
          preloadNextTrack();
        }

        if (status.didJustFinish) {
          if (repeatModeRef.current === "one") {
            loadAndPlayIndex(indexRef.current);
          } else {
            advance(1, repeatModeRef.current === "all");
          }
        }
      });
    } catch (error) {
      console.error("Playback Error:", error);
    }
  };

  const advance = (step: number, wrap: boolean) => {
    const list = queueRef.current;
    if (!list.length) return;

    let next = indexRef.current + step;

    if (next >= list.length) {
      if (!wrap) {
        setIsPlaying(false);
        return;
      }
      next = 0;
    } else if (next < 0) {
      next = wrap ? list.length - 1 : 0;
    }

    loadAndPlayIndex(next);
  };

  const playSong = async (song: Song, songList?: Song[]) => {
    const baseList = songList && songList.length ? songList : [song];
    originalQueueRef.current = baseList;

    // 1. Build the fresh base playlist queue starting from the tapped song
    const baseQueue = shuffleRef.current
      ? buildShuffledQueue(baseList, song)
      : baseList;

    const tappedIndex = baseQueue.findIndex((s) => s.id === song.id);
    const validIndex = tappedIndex === -1 ? 0 : tappedIndex;

    // 2. Extract remaining manually queued songs from the previous queue
    const remainingUserQueue =
      userQueueCountRef.current > 0
        ? queueRef.current.slice(
            indexRef.current + 1,
            indexRef.current + 1 + userQueueCountRef.current,
          )
        : [];

    // 3. Reconstruct context: [Tapped Song] -> [Preserved Manual Queue] -> [Rest of Playlist]
    const playlistBeforeTapped = baseQueue.slice(0, validIndex + 1);
    const playlistAfterTapped = baseQueue.slice(validIndex + 1);

    const newQueue = [
      ...playlistBeforeTapped,
      ...remainingUserQueue,
      ...playlistAfterTapped,
    ];

    // Keep the count intact for any new manual additions!
    userQueueCountRef.current = remainingUserQueue.length;

    updateQueueState(newQueue, validIndex);
    await loadAndPlayIndex(validIndex);
  };

  const seekTo = async (millis: number) => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded) {
          await soundRef.current.setStatusAsync({
            positionMillis: millis,
            seekMillisToleranceBefore: 500,
            seekMillisToleranceAfter: 500,
          });

          setPosition(millis);
        }
      }
    } catch (error) {
      console.error("❌ Failed to seek position:", error);
    }
  };

  const pauseSong = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && status.isPlaying) {
          await soundRef.current.pauseAsync();
          setIsPlaying(false);
        }
      }
    } catch (error) {
      console.error("❌ Failed to pause audio:", error);
    }
  };

  const resumeSong = async () => {
    try {
      if (soundRef.current) {
        const status = await soundRef.current.getStatusAsync();
        if (status.isLoaded && !status.isPlaying) {
          await soundRef.current.playAsync();
          setIsPlaying(true);
        }
      }
    } catch (error) {
      console.error("❌ Failed to resume audio:", error);
    }
  };

  const playNext = async () => {
    advance(1, true);
  };

  const playPrevious = async () => {
    if (position > 3000) {
      await loadAndPlayIndex(indexRef.current);
      return;
    }
    advance(-1, true);
  };

  const toggleShuffle = () => {
    setShuffle((prev) => {
      const next = !prev;
      shuffleRef.current = next;

      const current = queueRef.current[indexRef.current];
      const newQueue = next
        ? buildShuffledQueue(originalQueueRef.current, current)
        : originalQueueRef.current;

      let idx = 0;
      if (current) {
        const found = newQueue.findIndex((s) => s.id === current.id);
        idx = found === -1 ? 0 : found;
      }

      updateQueueState(newQueue, idx);
      return next;
    });
  };

  const cycleRepeatMode = () => {
    setRepeatMode((prev) =>
      prev === "off" ? "all" : prev === "all" ? "one" : "off",
    );
  };

  const reloadLyrics = async () => {
    if (currentSong) await loadOfflineCachedLyrics(currentSong.id);
  };

  const addToQueueNext = (song: Song) => {
    const newQueue = [...queueRef.current];
    const insertPosition = indexRef.current + 1;
    newQueue.splice(insertPosition, 0, song);
    updateQueueState(newQueue, indexRef.current);
  };

  const addToQueue = (song: Song) => {
    const newQueue = [...queueRef.current];
    const insertPosition = indexRef.current + 1 + userQueueCountRef.current;
    newQueue.splice(insertPosition, 0, song);
    userQueueCountRef.current += 1;
    updateQueueState(newQueue, indexRef.current);
  };

  const removeFromQueue = (index: number) => {
    if (index < 0 || index >= queueRef.current.length) return;
    const newQueue = [...queueRef.current];
    newQueue.splice(index, 1);

    let newIndex = indexRef.current;
    if (index < indexRef.current) {
      newIndex -= 1;
    }

    updateQueueState(newQueue, newIndex);
  };

  const reorderQueue = (fromIndex: number, toIndex: number) => {
    if (
      fromIndex < 0 ||
      fromIndex >= queueRef.current.length ||
      toIndex < 0 ||
      toIndex >= queueRef.current.length
    )
      return;

    const newQueue = [...queueRef.current];
    const [movedItem] = newQueue.splice(fromIndex, 1);
    newQueue.splice(toIndex, 0, movedItem);

    let newIndex = indexRef.current;
    if (fromIndex === indexRef.current) {
      newIndex = toIndex;
    } else if (fromIndex < indexRef.current && toIndex >= indexRef.current) {
      newIndex -= 1;
    } else if (fromIndex > indexRef.current && toIndex <= indexRef.current) {
      newIndex += 1;
    }

    updateQueueState(newQueue, newIndex);
  };

  const playFromQueue = async (index: number) => {
    await loadAndPlayIndex(index);
  };

  const toggleFavorite = async (songId?: string) => {
    const targetId = songId || currentSong?.id;
    if (!targetId) return;

    try {
      const db = await dbAsync;

      // 1. Fetch current favorite status
      const row: any = await db.getFirstAsync(
        "SELECT is_favorite FROM songs WHERE id = ?",
        [targetId],
      );
      const newStatus = row?.is_favorite ? 0 : 1;

      // 2. Persist update in Database
      await db.runAsync("UPDATE songs SET is_favorite = ? WHERE id = ?", [
        newStatus,
        targetId,
      ]);

      // 3. Update active song state if matching
      if (currentSong && currentSong.id === targetId) {
        setCurrentSong((prev) =>
          prev ? { ...prev, is_favorite: newStatus } : prev,
        );
        setIsFavorite(Boolean(newStatus));
      }

      // 4. Update queue references to keep UI synced across tabs
      const updateList = (list: Song[]) =>
        list.map((s) =>
          s.id === targetId ? { ...s, is_favorite: newStatus } : s,
        );

      const updatedQueue = updateList(queueRef.current);
      originalQueueRef.current = updateList(originalQueueRef.current);
      updateQueueState(updatedQueue, indexRef.current);
    } catch (error) {
      console.error("❌ Failed to toggle favorite status:", error);
    }
  };

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        position,
        duration,
        currentLyrics,
        shuffle,
        repeatMode,
        queue: queueState,
        currentIndex: currentIndexState,
        isFavorite,
        gaplessPlayback,
        crossfadeDuration,
        setGaplessPlayback,
        setCrossfadeDuration,
        playSong,
        pauseSong,
        resumeSong,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeatMode,
        reloadLyrics,
        seekTo,
        addToQueueNext,
        addToQueue,
        removeFromQueue,
        reorderQueue,
        playFromQueue,
        toggleFavorite,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
