// Small colored pill with the vehicle status text.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../common/AppText';
import { colors, radius, spacing } from '../../theme';
import { getStatusColor } from '../../utils/vehicleStatus';

export default function StatusBadge({ status }) {
  const statusColor = getStatusColor(status);
  return (
    <View style={styles.badge}>
      <View style={[styles.dot, { backgroundColor: statusColor }]} />
      <AppText variant="caption" color={statusColor}>
        {status}
      </AppText>
    </View>
  );
}

const styles = StyleSheet.create({
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