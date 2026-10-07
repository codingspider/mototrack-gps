import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.background },
  list: { flex: 1 },
  // gap puts the same space between the slider, grid, pay card and activities
  content: { padding: spacing.lg, gap: spacing.md },
});
