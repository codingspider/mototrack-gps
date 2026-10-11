// The vehicle's own picture from the server, the same everywhere in the app. Draws a plain car icon when it has none.
import React from 'react';
import { Image } from 'react-native';
import { Icon } from 'react-native-paper';
import { getVehicleIconSize, getVehicleIconUrl } from '../../utils/vehicleIcon';
import { useAppTheme } from '../../theme';

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {number} height Picture height (the width follows its shape)
 * @param {string} tintColor Optional color painted over the picture (the map uses the status color)
 * @param {function} onLoadEnd Called when the picture finished loading (the map marker uses this)
 */
export default function VehicleIcon({ vehicle, height = 28, tintColor, onLoadEnd }) {
  const { colors } = useAppTheme();
  const url = getVehicleIconUrl(vehicle);

  if (!url) {
    return <Icon source="car" size={height} color={colors.primary} />;
  }
  return (
    <Image
      source={{ uri: url }}
      style={[getVehicleIconSize(vehicle, height), tintColor ? { tintColor } : null]}
      resizeMode="contain"
      onLoadEnd={onLoadEnd}
    />
  );
}
