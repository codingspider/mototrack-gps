// The geofence being drawn, shown on the map (put inside <MapView>): a polygon (corner dots plus the area) or a
// circle (its centre dot plus the round area).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Circle, Marker, Polygon, Polyline } from 'react-native-maps';
import { radius, useAppTheme, useThemedStyles } from '../../theme';
import { MIN_GEOFENCE_POINTS } from '../../utils/geofence';

const DOT_SIZE = 16;

const makeStyles = (colors) =>
  StyleSheet.create({
    dot: {
      width: DOT_SIZE,
      height: DOT_SIZE,
      borderRadius: radius.round,
      backgroundColor: colors.secondary,
      borderWidth: 3,
      borderColor: colors.textOnPrimary,
    },
  });

/**
 * @param {Array<{latitude: number, longitude: number}>} points Corners tapped so far (polygon)
 * @param {string} color Hex color of the area (the theme red when not given)
 * @param {'polygon'|'circle'} shape What is being drawn (polygon when not given)
 * @param {{ latitude: number, longitude: number }|null} circleCenter Centre of the circle, once tapped
 * @param {number} circleRadius Radius of the circle in meters
 */
export default function GeofenceDraft({ points = [], color, shape = 'polygon', circleCenter = null, circleRadius = 0 }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const areaColor = color || colors.secondary;

  if (shape === 'circle') {
    if (!circleCenter) {
      return null;
    }
    return (
      <>
        <Circle center={circleCenter} radius={circleRadius} strokeColor={areaColor} fillColor={`${areaColor}33`} strokeWidth={3} />
        <Marker coordinate={circleCenter} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.dot} />
        </Marker>
      </>
    );
  }

  const hasArea = points.length >= MIN_GEOFENCE_POINTS;
  return (
    <>
      {hasArea && (
        <Polygon
          coordinates={points}
          strokeColor={areaColor}
          fillColor={`${areaColor}33`}
          strokeWidth={3}
        />
      )}
      {!hasArea && points.length > 1 && (
        <Polyline coordinates={points} strokeColor={areaColor} strokeWidth={3} />
      )}
      {points.map((point, index) => (
        // tracksViewChanges stays on so each new dot always draws
        <Marker key={`${point.latitude}-${point.longitude}-${index}`} coordinate={point} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.dot} />
        </Marker>
      ))}
    </>
  );
}
