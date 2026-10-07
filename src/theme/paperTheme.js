// Maps our theme colors onto React Native Paper's theme, so every Paper component follows light / dark mode.
import { MD3DarkTheme, MD3LightTheme } from 'react-native-paper';
import { radius } from './spacing';

/**
 * @param {object} colors The current palette from useAppTheme()
 * @param {boolean} isDark
 */
export function getPaperTheme(colors, isDark) {
  const baseTheme = isDark ? MD3DarkTheme : MD3LightTheme;
  return {
    ...baseTheme,
    roundness: radius.md,
    colors: {
      ...baseTheme.colors,
      primary: colors.primary,
      onPrimary: colors.textOnPrimary,
      primaryContainer: colors.primaryLight,
      onPrimaryContainer: colors.primary,
      secondary: colors.secondary,
      onSecondary: colors.textOnPrimary,
      secondaryContainer: colors.secondarySoft,
      onSecondaryContainer: colors.secondary,
      tertiary: colors.accent,
      background: colors.background,
      surface: colors.surface,
      surfaceVariant: colors.background,
      onSurface: colors.text,
      onSurfaceVariant: colors.textSecondary,
      outline: colors.border,
      outlineVariant: colors.border,
      error: colors.secondary,
      shadow: colors.shadow,
    },
  };
}
