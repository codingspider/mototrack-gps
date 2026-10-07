// "Call for any assistance" card with a call button.
import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Icon, IconButton } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { SUPPORT_PHONE } from '../../../config/support';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1, alignItems: 'center' },
  });

export default function SupportCard() {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Icon source="headset" size={24} color={colors.primary} />
      </View>
      <View style={styles.text}>
        <AppText variant="caption" color={colors.textSecondary}>
          Call for any assistance
        </AppText>
        <AppText variant="subtitle">{SUPPORT_PHONE}</AppText>
      </View>
      <IconButton
        icon="phone"
        size={24}
        iconColor={colors.textOnPrimary}
        containerColor={colors.primary}
        accessibilityLabel="Call support"
        onPress={() => Linking.openURL(`tel:${SUPPORT_PHONE}`)}
      />
    </View>
  );
}
