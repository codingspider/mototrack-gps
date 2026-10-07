// Small colored pill with the vehicle status text.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import { getStatusColor } from '../../utils/vehicleStatus';

const makeStyles = (colors) =>
  StyleSheet.create({
    badge: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: colors.background,
      borderRadius: radius.round,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
    },
    dot: { width: 8, height: 8, borderRadius: radius.round, marginRight: spacing.xs },
  });

export default function StatusBadge({ status }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const statusColor = getStatusColor(status, colors);

  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <AppText variant="caption" color={statusColor}>
        {status}
      </AppText>
    </View>
  );
}
