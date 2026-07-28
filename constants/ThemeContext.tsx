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

  const colors = useMemo(() => {
    const isDark = effectiveTheme === "dark";

    switch (activePreset) {
      case "oled":
        return isDark
          ? {
              ...darkColors,
              background: "#000000",
              surface: "#121212",
              primary: "#dfdfdf",
              border: "#222222",
              texttwo: "#121212",
            }
          : {
              ...lightColors,
              background: "#FFFFFF",
              surface: "#fefefe",
              primary: "#121212",
              border: "#e5e5e5",
              texttwo: "#fefefe",
            };

      case "midnight":
        return isDark
          ? {
              ...darkColors,
              background: "#030B19",
              surface: "#143D5B",
              primary: "#91C9E2",
              border: "#143D5B",
              texttwo: "#121212",
            }
          : {
              ...lightColors,
              background: "#E4F3F4",
              surface: "#91C9E2",
              primary: "#143D5B",
              border: "#91C9E2",
              texttwo: "#fefefe",
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
