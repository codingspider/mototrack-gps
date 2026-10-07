// Light / dark mode. Keeps the chosen mode (remembered on the phone) and gives every screen its colors.
//   const { colors, isDark, toggleTheme } = useAppTheme();
//   const styles = useThemedStyles(makeStyles);   // makeStyles = (colors) => StyleSheet.create({...})
import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { useColorScheme } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { darkColors, lightColors } from './colors';

const STORAGE_KEY = 'mototrack_theme_mode'; // 'light' | 'dark' (not a secret, so AsyncStorage is fine)

const ThemeContext = createContext({
  mode: 'light',
  isDark: false,
  colors: lightColors,
  toggleTheme: () => {},
});

export function ThemeProvider({ children }) {
  const systemScheme = useColorScheme();
  const [savedMode, setSavedMode] = useState(null);
  const [isLoaded, setIsLoaded] = useState(false);

  // Read the saved choice once at start. Without one, follow the phone's own setting.
  useEffect(() => {
    const loadMode = async () => {
      try {
        const value = await AsyncStorage.getItem(STORAGE_KEY);
        if (value === 'light' || value === 'dark') {
          setSavedMode(value);
        }
      } catch (error) {
        // Storage not available: just use the phone setting
      }
      setIsLoaded(true);
    };
    loadMode();
  }, []);

  const mode = savedMode || (systemScheme === 'dark' ? 'dark' : 'light');

  const toggleTheme = useCallback(async () => {
    const nextMode = mode === 'dark' ? 'light' : 'dark';
    setSavedMode(nextMode);
    try {
      await AsyncStorage.setItem(STORAGE_KEY, nextMode);
    } catch (error) {
      // The mode still changes for this session
    }
  }, [mode]);

  const value = useMemo(
    () => ({ mode, isDark: mode === 'dark', colors: mode === 'dark' ? darkColors : lightColors, toggleTheme }),
    [mode, toggleTheme],
  );

  // Wait for the saved mode so the app never flashes the wrong theme
  if (!isLoaded) {
    return null;
  }

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

/** The current colors and the mode switch. */
export function useAppTheme() {
  return useContext(ThemeContext);
}

/** Build a StyleSheet from the current colors (rebuilt only when the mode changes). */
export function useThemedStyles(makeStyles) {
  const { colors } = useAppTheme();
  return useMemo(() => makeStyles(colors), [makeStyles, colors]);
}
