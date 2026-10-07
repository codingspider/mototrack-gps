// One import for the whole theme:
//   import { useAppTheme, useThemedStyles, spacing, radius, typography } from '../theme';
import { darkColors, lightColors } from './colors';
import typography, { fonts } from './typography';
import { spacing, radius } from './spacing';
import { ThemeProvider, useAppTheme, useThemedStyles } from './ThemeContext';

export { darkColors, lightColors, typography, fonts, spacing, radius, ThemeProvider, useAppTheme, useThemedStyles };
