// Small menu to pick the map style: Google Map, Satellite, Hybrid, Terrain or OpenStreetMap.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

export const MAP_TYPE_OPTIONS = [
  { key: 'standard', label: 'Google Map', icon: 'map-outline' },
  { key: 'satellite', label: 'Satellite', icon: 'satellite-variant' },
  { key: 'hybrid', label: 'Hybrid', icon: 'layers-outline' },
  { key: 'terrain', label: 'Terrain', icon: 'terrain' },
  { key: 'osm', label: 'OpenStreetMap', icon: 'earth' },
];

const makeStyles = (colors) =>
  StyleSheet.create({
    menu: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      paddingVertical: spacing.xs,
      elevation: 6,
      shadowColor: colors.shadow,
    },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, paddingVertical: spacing.sm, paddingHorizontal: spacing.md },
    label: { flex: 1, minWidth: 110 },
  });

/**
 * @param {string} selected Key of the map style in use
 * @param {function} onSelect Called with the key the user picks
 */
export default function MapTypeMenu({ selected, onSelect }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.menu}>
      {MAP_TYPE_OPTIONS.map((option) => {
        const isSelected = option.key === selected;
        return (
          <TouchableRipple key={option.key} onPress={() => onSelect(option.key)}>
            <View style={styles.row}>
              <Icon source={option.icon} size={20} color={isSelected ? colors.primary : colors.textSecondary} />
              <AppText style={styles.label} color={isSelected ? colors.primary : colors.text}>
                {option.label}
              </AppText>
              {isSelected && <Icon source="check" size={18} color={colors.primary} />}
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}
