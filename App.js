// App root: Redux store + light/dark theme + Paper + navigation + the shared HTTP client setup.
import React, { useMemo } from 'react';
import { StatusBar } from 'react-native';
import { Provider } from 'react-redux';
import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { PaperProvider } from 'react-native-paper';
import store from './src/store';
import RootNavigator from './src/routes/RootNavigator';
import ToastHost from './src/components/common/ToastHost';
import { setupInterceptors } from './src/api/client';
import { logoutUser } from './src/store/slices/authSlice';
import { ThemeProvider, useAppTheme } from './src/theme';
import { getPaperTheme } from './src/theme/paperTheme';

// Lets the HTTP client read the hash and log out when the server rejects the session.
setupInterceptors(store, () => store.dispatch(logoutUser()));

// Lives inside ThemeProvider so it can read the current colors.
function ThemedApp() {
  const { colors, isDark } = useAppTheme();
  const paperTheme = useMemo(() => getPaperTheme(colors, isDark), [colors, isDark]);

  // Navigation draws screen backgrounds and headers with this theme
  const navigationTheme = useMemo(() => {
    const baseTheme = isDark ? DarkTheme : DefaultTheme;
    return {
      ...baseTheme,
      colors: {
        ...baseTheme.colors,
        primary: colors.primary,
        background: colors.background,
        card: colors.surface,
        text: colors.text,
        border: colors.border,
        notification: colors.secondary,
      },
    };
  }, [colors, isDark]);

  return (
    <PaperProvider theme={paperTheme}>
      <StatusBar backgroundColor={colors.surface} barStyle={isDark ? 'light-content' : 'dark-content'} />
      <NavigationContainer theme={navigationTheme}>
        <RootNavigator />
      </NavigationContainer>
      <ToastHost />
    </PaperProvider>
  );
}

export default function App() {
  return (
    <Provider store={store}>
      <SafeAreaProvider>
        <ThemeProvider>
          <ThemedApp />
        </ThemeProvider>
      </SafeAreaProvider>
    </Provider>
  );
}
