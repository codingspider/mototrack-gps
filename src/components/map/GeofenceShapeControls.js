// Polygon / Circle choice for drawing a geofence, and the − / + size buttons of a circle.
// Used by the vehicle map's drawing bar and the Add / Edit geofence page.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, TouchableRipple } from 'react-native-paper';
import AppText from '../common/AppText';
import { formatRadius } from '../../utils/geofence';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const SHAPES = [
  { key: 'polygon', label: 'Polygon', icon: 'vector-polygon' },
  { key: 'circle', label: 'Circle', icon: 'circle-outline' },
];

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flexWrap: 'wrap' },
    shapes: { flexDirection: 'row', gap: spacing.xs },
    chip: { borderRadius: radius.round, borderWidth: 1, borderColor: colors.primary, overflow: 'hidden' },
    chipActive: { backgroundColor: colors.primary },
    chipContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, paddingHorizontal: spacing.md, paddingVertical: 6 },
    chipText: { fontWeight: '700' },
    stepper: { flexDirection: 'row', alignItems: 'center', marginLeft: 'auto' },
    stepButton: { margin: 0 },
    size: { minWidth: 56, textAlign: 'center', fontWeight: '800' },
  });

/**
 * @param {'polygon'|'circle'} shape The shape being drawn
 * @param {function} onShapeChange Called with 'polygon' or 'circle'
 * @param {number} radiusMeters Size of the circle
 * @param {function} onRadiusStep Called with 1 (bigger) or -1 (smaller)
 */
export default function GeofenceShapeControls({ shape, onShapeChange, radiusMeters, onRadiusStep }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <View style={styles.shapes}>
        {SHAPES.map((item) => {
          const isActive = item.key === shape;
          const color = isActive ? colors.textOnPrimary : colors.primary;
          return (
            <TouchableRipple
              key={item.key}
              style={[styles.chip, isActive && styles.chipActive]}
              onPress={() => onShapeChange(item.key)}
              accessibilityRole="button"
              accessibilityState={{ selected: isActive }}
              accessibilityLabel={`Draw a ${item.label.toLowerCase()}`}
            >
              <View style={styles.chipContent}>
                <Icon source={item.icon} size={16} color={color} />
                <AppText variant="caption" color={color} style={styles.chipText}>
                  {item.label}
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
      </View>
      {shape === 'circle' && (
        <View style={styles.stepper}>
          <IconButton icon="minus" size={18} iconColor={colors.primary} style={styles.stepButton} onPress={() => onRadiusStep(-1)} accessibilityLabel="Smaller circle" />
          <AppText style={styles.size}>{formatRadius(radiusMeters)}</AppText>
          <IconButton icon="plus" size={18} iconColor={colors.primary} style={styles.stepButton} onPress={() => onRadiusStep(1)} accessibilityLabel="Bigger circle" />
        </View>
      )}
    </View>
  );
}
