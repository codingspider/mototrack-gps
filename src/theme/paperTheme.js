// Maps our theme tokens onto React Native Paper's theme, so every Paper component uses our colors.
import { MD3LightTheme } from 'react-native-paper';
import colors from './colors';
import { radius } from './spacing';

const paperTheme = {
  ...MD3LightTheme,
  roundness: radius.md,
  colors: {
    ...MD3LightTheme.colors,
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

export default paperTheme;
