import { Audio } from "expo-av";
import React, {
  createContext,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import { dbAsync } from "./Database";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
}

type RepeatMode = "off" | "all" | "one";

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentLyrics: string;
  shuffle: boolean;
  repeatMode: RepeatMode;
  playSong: (song: Song, queueList?: Song[]) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  playNext: () => Promise<void>;
  playPrevious: () => Promise<void>;
  toggleShuffle: () => void;
  cycleRepeatMode: () => void;
  reloadLyrics: () => Promise<void>;
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

  // Playback state lives in refs too, so the sound's status callback always
  // reads the latest queue/index/mode without needing to be re-subscribed
  // every time something changes.
  const soundRef = useRef<Audio.Sound | null>(null);
  const originalQueueRef = useRef<Song[]>([]); // list as it was tapped from (unshuffled)
  const queueRef = useRef<Song[]>([]); // actual playback order
  const indexRef = useRef<number>(-1);
  const shuffleRef = useRef(shuffle);
  const repeatModeRef = useRef(repeatMode);

  useEffect(() => {
    shuffleRef.current = shuffle;
  }, [shuffle]);

  useEffect(() => {
    repeatModeRef.current = repeatMode;
  }, [repeatMode]);

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (soundRef.current) {
        soundRef.current.unloadAsync();
      }
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

  // Builds a shuffled order but keeps `keep` pinned first, so shuffling
  // doesn't interrupt the track that's currently playing.
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

  // Loads and plays whatever sits at queueRef.current[index]. This is the
  // single place that actually starts playback — playSong/playNext/
  // playPrevious/repeat-one all funnel through here.
  const loadAndPlayIndex = async (index: number) => {
    const list = queueRef.current;
    if (!list.length || index < 0 || index >= list.length) return;

    const song = list[index];
    indexRef.current = index;

    try {
      if (soundRef.current) {
        await soundRef.current.unloadAsync();
        soundRef.current = null;
      }

      setIsPlaying(false);
      setCurrentSong(song);
      setPosition(0);

      await loadOfflineCachedLyrics(song.id);

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.file_path },
        { shouldPlay: true },
      );

      soundRef.current = sound;
      setIsPlaying(true);

      const db = await dbAsync;
      await db.runAsync(
        "UPDATE songs SET play_count = play_count + 1, last_played = ? WHERE id = ?",
        [Date.now(), song.id],
      );

      sound.setOnPlaybackStatusUpdate((status) => {
        if (!status.isLoaded) return;

        setPosition(status.positionMillis);
        if (status.durationMillis) setDuration(status.durationMillis);

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

  // Moves the index by `step`. `wrap` controls what happens at the edges:
  // used for both manual skip (always wraps) and auto-advance-on-finish
  // (only wraps when repeat is "all").
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
    queueRef.current = shuffleRef.current
      ? buildShuffledQueue(baseList, song)
      : baseList;

    const startIndex = queueRef.current.findIndex((s) => s.id === song.id);
    await loadAndPlayIndex(startIndex === -1 ? 0 : startIndex);
  };

  const pauseSong = async () => {
    if (soundRef.current && isPlaying) {
      await soundRef.current.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSong = async () => {
    if (soundRef.current && !isPlaying) {
      await soundRef.current.playAsync();
      setIsPlaying(true);
    }
  };

  const playNext = async () => {
    advance(1, true);
  };

  const playPrevious = async () => {
    // Match the common player convention: if you're more than 3s into a
    // track, "previous" restarts it instead of jumping back a song.
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
      queueRef.current = next
        ? buildShuffledQueue(originalQueueRef.current, current)
        : originalQueueRef.current;

      if (current) {
        const idx = queueRef.current.findIndex((s) => s.id === current.id);
        indexRef.current = idx === -1 ? 0 : idx;
      }

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
        playSong,
        pauseSong,
        resumeSong,
        playNext,
        playPrevious,
        toggleShuffle,
        cycleRepeatMode,
        reloadLyrics,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
