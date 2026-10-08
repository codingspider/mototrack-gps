// The geofence being drawn, shown on the map: corner dots plus the area (put inside <MapView>).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Marker, Polygon, Polyline } from 'react-native-maps';
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
 * @param {Array<{latitude: number, longitude: number}>} points Corners tapped so far
 */
export default function GeofenceDraft({ points }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const hasArea = points.length >= MIN_GEOFENCE_POINTS;

  return (
    <>
      {hasArea && (
        <Polygon
          coordinates={points}
          strokeColor={colors.secondary}
          fillColor={`${colors.secondary}33`}
          strokeWidth={3}
        />
      )}
      {!hasArea && points.length > 1 && (
        <Polyline coordinates={points} strokeColor={colors.secondary} strokeWidth={3} />
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
