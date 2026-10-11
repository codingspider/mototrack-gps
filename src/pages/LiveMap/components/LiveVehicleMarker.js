// One vehicle on the live map: its own picture, turned the way it heads.
// Tapping it opens the vehicle details. The vehicle object comes from Redux, so the marker moves with the socket.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker } from 'react-native-maps';
import VehicleIcon from '../../../components/vehicle/VehicleIcon';
import { getVehicleIconUrl, shouldRotateIcon } from '../../../utils/vehicleIcon';

const MARKER_SIZE = 40;
const ICON_HEIGHT = 30;
const REFRESH_MAX_MS = 3000; // a marker is a picture of its view: keep it fresh only while the icon downloads
const SETTLE_MS = 200;

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {{ latitude: number, longitude: number }} coordinate Where to draw it
 * @param {function} onPress Called with the vehicle id
 */
function LiveVehicleMarker({ vehicle, coordinate, onPress }) {
  const iconUrl = getVehicleIconUrl(vehicle);
  const [isTrackingView, setIsTrackingView] = useState(true);

  useEffect(() => {
    setIsTrackingView(true);
    const timer = setTimeout(() => setIsTrackingView(false), REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, [iconUrl]);

  const handleIconLoaded = () => setTimeout(() => setIsTrackingView(false), SETTLE_MS);
  const rotation = shouldRotateIcon(vehicle) ? Number(vehicle.course) || 0 : 0;

  return (
    <Marker
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      flat
      rotation={rotation}
      tracksViewChanges={isTrackingView}
      onPress={() => onPress(vehicle.id)}
    >
      <View style={styles.marker}>
        <VehicleIcon vehicle={vehicle} height={ICON_HEIGHT} onLoadEnd={handleIconLoaded} />
      </View>
    </Marker>
  );
}

// Re-draw only when this vehicle (or where it is) changed, not on every other vehicle's update
export default React.memo(LiveVehicleMarker);

const styles = StyleSheet.create({
  marker: { width: MARKER_SIZE, height: MARKER_SIZE, alignItems: 'center', justifyContent: 'center' },
});
