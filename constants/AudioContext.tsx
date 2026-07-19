import { Audio } from "expo-av";
import React, { createContext, useContext, useEffect, useState } from "react";

interface Song {
  id: string;
  title: string;
  artist: string;
  album: string;
  genre: string;
  duration: number;
  file_path: string;
}

interface AudioContextType {
  currentSong: Song | null;
  isPlaying: boolean;
  position: number;
  duration: number;
  currentLyrics: string; // <-- New variable broadcast string
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
  reloadLyrics: () => Promise<void>; // <-- Force re-fetch function trigger
}

const AudioContext = createContext<AudioContextType>({} as AudioContextType);

export const AudioProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [soundInstance, setSoundInstance] = useState<Audio.Sound | null>(null);
  const [currentSong, setCurrentSong] = useState<Song | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [position, setPosition] = useState(0);
  const [duration, setDuration] = useState(1);
  const [currentLyrics, setCurrentLyrics] = useState(""); // Holds plain text blocks

  useEffect(() => {
    Audio.setAudioModeAsync({
      allowsRecordingIOS: false,
      staysActiveInBackground: true,
      playsInSilentModeIOS: true,
    });

    return () => {
      if (soundInstance) {
        soundInstance.unloadAsync();
      }
    };
  }, [soundInstance]);

  const loadOfflineCachedLyrics = async (songId: string) => {
    try {
      const db = (await import("./Database")).dbAsync;
      const cached: any = await (
        await db
      ).getFirstAsync(
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

  const playSong = async (song: Song) => {
    try {
      if (soundInstance) {
        await soundInstance.unloadAsync();
      }

      setIsPlaying(false);
      setCurrentSong(song);

      // Pull lyrics out of your phone's database storage right when track initializes
      await loadOfflineCachedLyrics(song.id);

      const { sound } = await Audio.Sound.createAsync(
        { uri: song.file_path },
        { shouldPlay: true },
      );

      setSoundInstance(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded) {
          setPosition(status.positionMillis);
          if (status.durationMillis) {
            setDuration(status.durationMillis);
          }
          if (status.didJustFinish) {
            setIsPlaying(false);
            setPosition(0);
          }
        }
      });
    } catch (error) {
      console.error("Playback Error:", error);
    }
  };

  const pauseSong = async () => {
    if (soundInstance && isPlaying) {
      await soundInstance.pauseAsync();
      setIsPlaying(false);
    }
  };

  const resumeSong = async () => {
    if (soundInstance && !isPlaying) {
      await soundInstance.playAsync();
      setIsPlaying(true);
    }
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
        playSong,
        pauseSong,
        resumeSong,
        reloadLyrics,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
