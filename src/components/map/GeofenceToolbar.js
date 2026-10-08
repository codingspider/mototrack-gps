// Bar at the top of the map while drawing a geofence: hint, undo, clear, cancel and done.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import AppText from '../common/AppText';
import { MIN_GEOFENCE_POINTS } from '../../utils/geofence';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      right: spacing.sm,
      flexDirection: 'row',
      alignItems: 'center',
      paddingLeft: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      elevation: 4,
      shadowColor: colors.shadow,
    },
    hint: { flex: 1 },
    button: { margin: 0 },
  });

/**
 * @param {number} pointCount Corners tapped so far
 * @param {function} onUndo Remove the last corner
 * @param {function} onClear Remove all corners
 * @param {function} onCancel Leave drawing mode
 * @param {function} onDone Finish the area (needs 3 corners)
 */
export default function GeofenceToolbar({ pointCount, onUndo, onClear, onCancel, onDone }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const canFinish = pointCount >= MIN_GEOFENCE_POINTS;
  const hint = canFinish ? `${pointCount} points` : `Tap the map to add points (${pointCount}/${MIN_GEOFENCE_POINTS})`;

  return (
    <View style={styles.bar}>
      <AppText variant="caption" style={styles.hint} numberOfLines={2}>
        {hint}
      </AppText>
      <IconButton icon="undo" size={20} iconColor={colors.primary} style={styles.button} disabled={pointCount === 0} onPress={onUndo} accessibilityLabel="Undo last point" />
      <IconButton icon="delete-outline" size={20} iconColor={colors.primary} style={styles.button} disabled={pointCount === 0} onPress={onClear} accessibilityLabel="Clear points" />
      <IconButton icon="close" size={20} iconColor={colors.textSecondary} style={styles.button} onPress={onCancel} accessibilityLabel="Cancel drawing" />
      <IconButton icon="check" size={20} iconColor={colors.textOnPrimary} containerColor={colors.primary} style={styles.button} disabled={!canFinish} onPress={onDone} accessibilityLabel="Finish geofence" />
    </View>
  );
}
