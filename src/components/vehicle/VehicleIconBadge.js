// The vehicle's picture on a round white badge, ringed in the status color. Used in lists and on the details page.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { radius, useAppTheme, useThemedStyles } from '../../theme';
import { getStatusColor } from '../../utils/vehicleStatus';
import VehicleIcon from './VehicleIcon';

const makeStyles = (colors) =>
  StyleSheet.create({
    badge: {
      borderRadius: radius.round,
      borderWidth: 2,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {number} size Badge diameter
 */
export default function VehicleIconBadge({ vehicle, size = 44 }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const ringColor = getStatusColor(vehicle.status, colors);

  return (
    <View style={[styles.badge, { width: size, height: size, borderColor: ringColor }]}>
      <VehicleIcon vehicle={vehicle} height={Math.round(size * 0.68)} />
    </View>
  );
}
