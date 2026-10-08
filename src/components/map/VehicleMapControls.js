// The buttons that float on the vehicle map: map style and geofence (top left), Street View and the compass
// (top right), zoom in / out (bottom left), my location and the tracker's location (bottom right).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { spacing } from '../../theme';
import MapControlButton from './MapControlButton';

const styles = StyleSheet.create({
  topLeft: { position: 'absolute', top: spacing.sm, left: spacing.sm, gap: spacing.sm },
  topRight: { position: 'absolute', top: spacing.sm, right: spacing.sm, gap: spacing.sm },
  bottomLeft: { position: 'absolute', bottom: spacing.sm, left: spacing.sm, gap: spacing.sm },
  bottomRight: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, gap: spacing.sm },
});

export default function VehicleMapControls({
  isMapTypeOpen,
  showsUserLocation,
  isFollowing,
  isRotated,
  onMapType,
  onGeofence,
  onStreetView,
  onResetNorth,
  onZoomIn,
  onZoomOut,
  onMyLocation,
  onTrackerLocation,
}) {
  return (
    <>
      <View style={styles.topLeft}>
        <MapControlButton icon="layers-outline" label="Map style" isActive={isMapTypeOpen} onPress={onMapType} />
        <MapControlButton icon="vector-polygon" label="Draw geofence" onPress={onGeofence} />
      </View>
      <View style={styles.topRight}>
        <MapControlButton icon="google-street-view" label="Street View" onPress={onStreetView} />
        {isRotated && <MapControlButton icon="compass-outline" label="Face north" onPress={onResetNorth} />}
      </View>
      <View style={styles.bottomLeft}>
        <MapControlButton icon="plus" label="Zoom in" onPress={onZoomIn} />
        <MapControlButton icon="minus" label="Zoom out" onPress={onZoomOut} />
      </View>
      <View style={styles.bottomRight}>
        <MapControlButton icon="crosshairs-gps" label="My location" isActive={showsUserLocation} onPress={onMyLocation} />
        <MapControlButton icon="car-connected" label="Tracker location" isActive={isFollowing} onPress={onTrackerLocation} />
      </View>
    </>
  );
}
