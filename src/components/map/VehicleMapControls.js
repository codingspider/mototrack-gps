// The buttons that float on the vehicle map: map style, geofence and vehicle name (top left), Street View and the compass
// (top right), zoom in / out, my location and the tracker's location (bottom right).
import React from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import { useTranslation } from '../../i18n/LanguageContext';
import { spacing } from '../../theme';
import MapControlButton from './MapControlButton';

const styles = StyleSheet.create({
  topLeft: { position: 'absolute', top: spacing.sm, left: spacing.sm, gap: spacing.sm },
  topRight: { position: 'absolute', top: spacing.sm, right: spacing.sm, gap: spacing.sm },
  bottomRight: { position: 'absolute', bottom: spacing.sm, right: spacing.sm, gap: spacing.sm },
});

export default function VehicleMapControls({
  isMapTypeOpen,
  showsUserLocation,
  isFollowing,
  isRotated,
  isLabelShown,
  onMapType,
  onGeofence,
  onToggleLabel,
  onStreetView,
  onResetNorth,
  onZoomIn,
  onZoomOut,
  onMyLocation,
  onTrackerLocation,
  bottomLift,
}) {
  const { t } = useTranslation();
  // The bottom buttons ride above the details sheet (bottomLift is a negative number of pixels, animated)
  const liftStyle = bottomLift ? { transform: [{ translateY: bottomLift }] } : null;
  return (
    <>
      <View style={styles.topLeft}>
        <MapControlButton icon="layers-outline" label="Map style" isActive={isMapTypeOpen} onPress={onMapType} />
        <MapControlButton icon="vector-polygon" label="Draw geofence" onPress={onGeofence} />
        <MapControlButton icon="tag-text-outline" label={t('map.vehicleName')} isActive={isLabelShown} onPress={onToggleLabel} />
      </View>
      <View style={styles.topRight}>
        <MapControlButton icon="google-street-view" label="Street View" onPress={onStreetView} />
        {isRotated && <MapControlButton icon="compass-outline" label="Face north" onPress={onResetNorth} />}
      </View>
      <Animated.View style={[styles.bottomRight, liftStyle]}>
        <MapControlButton icon="plus" label="Zoom in" onPress={onZoomIn} />
        <MapControlButton icon="minus" label="Zoom out" onPress={onZoomOut} />
        <MapControlButton icon="crosshairs-gps" label="My location" isActive={showsUserLocation} onPress={onMyLocation} />
        <MapControlButton icon="car-connected" label="Tracker location" isActive={isFollowing} onPress={onTrackerLocation} />
      </Animated.View>
    </>
  );
}
