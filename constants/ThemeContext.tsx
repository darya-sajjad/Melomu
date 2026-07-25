import { ThemePresetOption } from "@/components/settings/ThemePresetModal";
import AsyncStorage from "@react-native-async-storage/async-storage";
import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useColorScheme } from "react-native";
import { Colors, darkColors, lightColors } from "./theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  colors: Colors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
  activePreset: ThemePresetOption;
  setActivePreset: (preset: ThemePresetOption) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [manualTheme, setManualTheme] = useState<ThemeMode>("dark");
  const [activePreset, setActivePresetState] =
    useState<ThemePresetOption>("system");

  useEffect(() => {
    const loadThemeAndPreset = async () => {
      try {
        const savedPreset = await AsyncStorage.getItem("user-preset");
        if (
          savedPreset === "system" ||
          savedPreset === "classic" ||
          savedPreset === "oled" ||
          savedPreset === "midnight"
        ) {
          setActivePresetState(savedPreset as ThemePresetOption);
        }

        const savedTheme = await AsyncStorage.getItem("user-theme");
        if (savedTheme === "light" || savedTheme === "dark") {
          setManualTheme(savedTheme);
        }
      } catch (e) {
        console.error("Failed to load theme settings:", e);
      }
    };
    loadThemeAndPreset();
  }, []);

  // Compute effective mode: 'system' tracks OS, others respect the toggle
  const effectiveTheme: ThemeMode =
    activePreset === "system"
      ? systemColorScheme === "light"
        ? "light"
        : "dark"
      : manualTheme;

  const toggleTheme = async () => {
    const nextTheme = effectiveTheme === "dark" ? "light" : "dark";
    setManualTheme(nextTheme);
    await AsyncStorage.setItem("user-theme", nextTheme);
  };

  const setTheme = async (mode: ThemeMode) => {
    setManualTheme(mode);
    await AsyncStorage.setItem("user-theme", mode);
  };

  const setActivePreset = async (preset: ThemePresetOption) => {
    setActivePresetState(preset);
    await AsyncStorage.setItem("user-preset", preset);
  };

  // Generate dynamic color palettes for both Light & Dark modes per preset
  const colors = useMemo(() => {
    const isDark = effectiveTheme === "dark";

    switch (activePreset) {
      case "oled":
        return isDark
          ? {
              ...darkColors,
              background: "#000000",
              surface: "#121212",
              border: "#222222",
            }
          : {
              ...lightColors,
              background: "#FFFFFF",
              surface: "#F5F5F5",
              border: "#E0E0E0",
            };

      case "midnight":
        return isDark
          ? {
              ...darkColors,
              background: "#0A0E17",
              surface: "#111827",
              border: "#1F2937",
            }
          : {
              ...lightColors,
              background: "#F0F4F8",
              surface: "#E2E8F0",
              border: "#CBD5E1",
            };

      case "classic":
      case "system":
      default:
        return isDark ? darkColors : lightColors;
    }
  }, [effectiveTheme, activePreset]);

  return (
    <ThemeContext.Provider
      value={{
        theme: effectiveTheme,
        colors,
        toggleTheme,
        setTheme,
        activePreset,
        setActivePreset,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
