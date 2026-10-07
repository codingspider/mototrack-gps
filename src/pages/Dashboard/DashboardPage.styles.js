import { StyleSheet } from 'react-native';
import { spacing } from '../../theme';

// Styles that depend on the light / dark colors. Use with useThemedStyles(makeStyles).
export default (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { flex: 1 },
    // gap puts the same space between the slider, grid, pay card and activities
    content: { padding: spacing.lg, gap: spacing.md },
  });
