// Bar at the top of the map while drawing a geofence: hint, undo, clear, cancel and done, and under them the
// Polygon / Circle choice (with the circle's size buttons).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import AppText from '../common/AppText';
import { MIN_GEOFENCE_POINTS } from '../../utils/geofence';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import GeofenceShapeControls from './GeofenceShapeControls';

const makeStyles = (colors) =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      top: spacing.sm,
      left: spacing.sm,
      right: spacing.sm,
      paddingLeft: spacing.md,
      paddingBottom: spacing.sm,
      paddingRight: spacing.xs,
      borderRadius: radius.lg,
      backgroundColor: colors.surface,
      elevation: 4,
      shadowColor: colors.shadow,
    },
    row: { flexDirection: 'row', alignItems: 'center' },
    hint: { flex: 1 },
    button: { margin: 0 },
  });

/** The words of the bar for what has been drawn so far. */
function getHint(shape, pointCount, hasCenter) {
  if (shape === 'circle') {
    return hasCenter ? 'Tap the map to move the circle' : 'Tap the map to place the circle';
  }
  return pointCount >= MIN_GEOFENCE_POINTS
    ? `${pointCount} points`
    : `Tap the map to add points (${pointCount}/${MIN_GEOFENCE_POINTS})`;
}

/**
 * @param {'polygon'|'circle'} shape What is being drawn
 * @param {function} onShapeChange Called with 'polygon' or 'circle'
 * @param {number} pointCount Corners tapped so far (polygon)
 * @param {boolean} hasCenter The circle's centre has been placed
 * @param {number} radiusMeters Size of the circle
 * @param {function} onRadiusStep Called with 1 (bigger) or -1 (smaller)
 * @param {function} onUndo Remove the last corner
 * @param {function} onClear Remove all corners / the circle
 * @param {function} onCancel Leave drawing mode
 * @param {function} onDone Finish the area (needs 3 corners, or a placed circle)
 */
export default function GeofenceToolbar({
  shape = 'polygon',
  onShapeChange,
  pointCount,
  hasCenter = false,
  radiusMeters,
  onRadiusStep,
  onUndo,
  onClear,
  onCancel,
  onDone,
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const isCircle = shape === 'circle';
  const canFinish = isCircle ? hasCenter : pointCount >= MIN_GEOFENCE_POINTS;
  const hasDrawing = isCircle ? hasCenter : pointCount > 0;

  return (
    <View style={styles.bar}>
      <View style={styles.row}>
        <AppText variant="caption" style={styles.hint} numberOfLines={2}>
          {getHint(shape, pointCount, hasCenter)}
        </AppText>
        {!isCircle && (
          <IconButton icon="undo" size={20} iconColor={colors.primary} style={styles.button} disabled={pointCount === 0} onPress={onUndo} accessibilityLabel="Undo last point" />
        )}
        <IconButton icon="delete-outline" size={20} iconColor={colors.primary} style={styles.button} disabled={!hasDrawing} onPress={onClear} accessibilityLabel={isCircle ? 'Remove the circle' : 'Clear points'} />
        <IconButton icon="close" size={20} iconColor={colors.textSecondary} style={styles.button} onPress={onCancel} accessibilityLabel="Cancel drawing" />
        <IconButton icon="check" size={20} iconColor={colors.textOnPrimary} containerColor={colors.primary} style={styles.button} disabled={!canFinish} onPress={onDone} accessibilityLabel="Finish geofence" />
      </View>
      {!!onShapeChange && (
        <GeofenceShapeControls shape={shape} onShapeChange={onShapeChange} radiusMeters={radiusMeters} onRadiusStep={onRadiusStep} />
      )}
    </View>
  );
}
