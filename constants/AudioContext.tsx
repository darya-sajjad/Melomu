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
  playSong: (song: Song) => Promise<void>;
  pauseSong: () => Promise<void>;
  resumeSong: () => Promise<void>;
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

  const playSong = async (song: Song) => {
    try {
      if (soundInstance) {
        await soundInstance.unloadAsync();
      }

      setIsPlaying(false);
      setCurrentSong(song);

      try {
        const db = (await import("./Database")).dbAsync;
        const currentTimestamp = Date.now();

        await (
          await db
        ).runAsync(
          `UPDATE songs SET play_count = play_count + 1, last_played = ? WHERE id = ?`,
          [currentTimestamp, song.id],
        );
        console.log(`📈 Logged history update for track: ${song.title}`);
      } catch (dbError) {
        console.error("Failed to log track history criteria:", dbError);
      }

      console.log("🎵 Audio player loading real track path:", song.file_path);

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

  return (
    <AudioContext.Provider
      value={{
        currentSong,
        isPlaying,
        position,
        duration,
        playSong,
        pauseSong,
        resumeSong,
      }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
