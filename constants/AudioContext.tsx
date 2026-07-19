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

      const sampleAudioUrl = "https://soundhelix.com";

      const { sound } = await Audio.Sound.createAsync(
        { uri: sampleAudioUrl },
        { shouldPlay: true },
      );

      setSoundInstance(sound);
      setIsPlaying(true);

      sound.setOnPlaybackStatusUpdate((status) => {
        if (status.isLoaded && status.didJustFinish) {
          setIsPlaying(false);
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
      value={{ currentSong, isPlaying, playSong, pauseSong, resumeSong }}
    >
      {children}
    </AudioContext.Provider>
  );
};

export const useAudio = () => useContext(AudioContext);
