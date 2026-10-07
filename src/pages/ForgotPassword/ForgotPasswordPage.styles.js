import { StyleSheet } from 'react-native';
import { colors, spacing } from '../../theme';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1, padding: spacing.xl },
  intro: { marginBottom: spacing.xl },
  errorText: { marginBottom: spacing.lg },
});