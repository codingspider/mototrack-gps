// One number card of the summary: icon, label, big value and a small caption.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { flex: 1, padding: spacing.md, gap: spacing.sm },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: radius.round,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    value: { fontSize: 22, lineHeight: 28, fontWeight: '800' },
  });

/**
 * @param {string} icon Paper icon name
 * @param {string} label e.g. "Trips"
 * @param {string|null} value e.g. "28" (null shows "-")
 * @param {string} caption e.g. "Total journeys"
 */
export default function StatCard({ icon, label, value, caption }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <View style={styles.iconCircle}>
          <Icon source={icon} size={20} color={colors.primary} />
        </View>
        <AppText color={colors.textSecondary}>{label}</AppText>
      </View>
      <AppText style={styles.value} numberOfLines={1}>
        {value ?? '-'}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
        {caption}
      </AppText>
    </Card>
  );
}
