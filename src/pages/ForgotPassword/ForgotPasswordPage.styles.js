import { StyleSheet } from 'react-native';
import { spacing } from '../../theme';

// Styles that depend on the light / dark colors. Use with useThemedStyles(makeStyles).
export default (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1, padding: spacing.xl },
    intro: { marginBottom: spacing.xl },
  });
