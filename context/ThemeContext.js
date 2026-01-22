import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Appearance } from "react-native";

const ThemeContext = createContext();

export const ThemeProvider = ({ children }) => {
  const [isDark, setIsDark] = useState(false);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const loadTheme = async () => {
      try {
        const savedTheme = await AsyncStorage.getItem("themeMode");
        if (savedTheme !== null) {
          setIsDark(savedTheme === "dark");
        }
      } catch (e) {
        console.log("Błąd ładowania motywu:", e);
        setIsDark(false);
      } finally {
        setIsReady(true);
      }
    };
    loadTheme();

    const subscription = Appearance.addChangeListener(({ colorScheme }) => {
      if (!AsyncStorage.getItem("themeMode")) {
        setIsDark(colorScheme === "dark");
      }
    });

    return () => subscription.remove();
  }, []);

  const toggleTheme = async () => {
    const newValue = !isDark;
    setIsDark(newValue);
    try {
      await AsyncStorage.setItem("themeMode", newValue ? "dark" : "light");
    } catch (e) {
      console.log("Błąd zapisu motywu:", e);
    }
  };

  if (!isReady) return null;

  const theme = {
    isDark,
    toggleTheme,
    colors: {
      background: isDark ? "#0d1117" : "#f8f9fa",
      card: isDark ? "#161b22" : "#ffffff",
      text: isDark ? "#c9d1d9" : "#24292e",
      textSecondary: isDark ? "#8b949e" : "#586069",
      border: isDark ? "#30363d" : "#e1e4e8",
      primary: "#2e7d32",
      primaryDark: "#1b5e20",
      accent: "#4caf50",
      danger: "#d32f2f",
    },
  };

  return (
    <ThemeContext.Provider value={theme}>{children}</ThemeContext.Provider>
  );
};

export const useTheme = () => useContext(ThemeContext);
