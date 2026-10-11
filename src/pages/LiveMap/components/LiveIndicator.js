// Small pill on the live map: "Live" when the socket is connected, otherwise "Reconnecting…".
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      elevation: 3,
    },
    dot: { width: 8, height: 8, borderRadius: radius.round },
  });

/** @param {'connected'|'connecting'|'disconnected'} status From appSlice.socketStatus */
export default function LiveIndicator({ status }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const isLive = status === 'connected';

  return (
    <View style={styles.pill}>
      <View style={[styles.dot, { backgroundColor: isLive ? colors.statusOnline : colors.accent }]} />
      <AppText variant="caption">{isLive ? 'Live' : 'Reconnecting…'}</AppText>
    </View>
  );
}
