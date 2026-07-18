import AsyncStorage from "@react-native-async-storage/async-storage";
import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { Colors, darkColors, lightColors } from "./theme";

type ThemeMode = "light" | "dark";

interface ThemeContextType {
  theme: ThemeMode;
  colors: Colors;
  toggleTheme: () => void;
  setTheme: (mode: ThemeMode) => void;
}

const ThemeContext = createContext<ThemeContextType>({} as ThemeContextType);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const systemColorScheme = useColorScheme();
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    // Load the saved theme from standard device storage
    const loadTheme = async () => {
      const savedTheme = await AsyncStorage.getItem("user-theme");
      if (savedTheme === "light" || savedTheme === "dark") {
        setThemeState(savedTheme);
      } else if (systemColorScheme) {
        setThemeState(systemColorScheme);
      }
    };
    loadTheme();
  }, [systemColorScheme]);

  const toggleTheme = async () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setThemeState(nextTheme);
    await AsyncStorage.setItem("user-theme", nextTheme);
  };

  const setTheme = async (mode: ThemeMode) => {
    setThemeState(mode);
    await AsyncStorage.setItem("user-theme", mode);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
