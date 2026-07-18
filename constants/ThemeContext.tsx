import React, { createContext, useContext, useEffect, useState } from "react";
import { useColorScheme } from "react-native";
import { useMMKVString } from "react-native-mmkv"; // Modern reactivity hook
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

  // This automatically reactive hook replaces the manual storage.get/set lines completely!
  const [savedTheme, setSavedTheme] = useMMKVString("user-theme");
  const [theme, setThemeState] = useState<ThemeMode>("dark");

  useEffect(() => {
    if (savedTheme === "light" || savedTheme === "dark") {
      setThemeState(savedTheme);
    } else if (systemColorScheme) {
      setThemeState(systemColorScheme);
    }
  }, [savedTheme, systemColorScheme]);

  const toggleTheme = () => {
    const nextTheme = theme === "dark" ? "light" : "dark";
    setSavedTheme(nextTheme);
  };

  const setTheme = (mode: ThemeMode) => {
    setSavedTheme(mode);
  };

  const colors = theme === "dark" ? darkColors : lightColors;

  return (
    <ThemeContext.Provider value={{ theme, colors, toggleTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
