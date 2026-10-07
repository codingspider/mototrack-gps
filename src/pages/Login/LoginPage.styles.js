import { StyleSheet } from 'react-native';
import { colors, radius, spacing } from '../../theme';

export default StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: colors.background },
  content: { flexGrow: 1 },
  card: {
    marginTop: -spacing.xxl,
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.lg,
    borderRadius: radius.lg,
  },
  title: { marginBottom: spacing.lg },
  errorBox: { marginBottom: spacing.md },
  forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.sm },
  divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
  dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
  dividerText: { marginHorizontal: spacing.md },
});
