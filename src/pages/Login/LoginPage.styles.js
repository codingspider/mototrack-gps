import { StyleSheet } from 'react-native';
import { radius, spacing } from '../../theme';

// Styles that depend on the light / dark colors. Use with useThemedStyles(makeStyles).
export default (colors) =>
  StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: colors.background },
    content: { flexGrow: 1 },
    card: {
      marginTop: -spacing.xxl,
      marginHorizontal: spacing.md,
      marginBottom: spacing.lg,
      padding: spacing.lg,
      borderRadius: radius.lg,
    },
    logo: { alignItems: 'center', marginBottom: spacing.md },
    title: { marginBottom: spacing.lg },
    forgot: { alignSelf: 'flex-end', marginTop: -spacing.sm, marginBottom: spacing.sm },
    divider: { flexDirection: 'row', alignItems: 'center', marginVertical: spacing.lg },
    dividerLine: { flex: 1, height: 1, backgroundColor: colors.border },
    dividerText: { marginHorizontal: spacing.md },
  });
