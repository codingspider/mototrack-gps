// Live map for one vehicle. The marker glides between live positions (never jumps), points the way the
// vehicle heads, takes its color from the vehicle status, and the camera follows it unless the user pans away.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Easing, StyleSheet, View } from 'react-native';
import MapView, { AnimatedRegion, MarkerAnimated, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon, IconButton } from 'react-native-paper';
import { useSelector } from 'react-redux';
import AppText from '../common/AppText';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import { getStatusColor } from '../../utils/vehicleStatus';
import darkMapStyle from './darkMapStyle';

const START_DELTA = 0.01; // zoom when the map opens
const MIN_GLIDE_MS = 1000; // a glide is never shorter or longer than this
const MAX_GLIDE_MS = 6000;
const MAX_TRAIL_POINTS = 60;
const MARKER_SIZE = 40;

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { overflow: 'hidden', backgroundColor: colors.skeleton },
    noLocation: { flex: 1, alignItems: 'center', justifyContent: 'center' },
    marker: {
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.textOnPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    followButton: { position: 'absolute', right: spacing.sm, bottom: spacing.sm, margin: 0 },
  });

const toNumber = (value) => (value === null || value === undefined || value === '' ? null : Number(value));
const toCoordinate = (point) => ({ latitude: Number(point.lat), longitude: Number(point.lng) });

/**
 * @param {number} vehicleId Vehicle id (the vehicle is read from Redux, so it moves live)
 * @param {number} height Map height
 */
export default function VehicleMap({ vehicleId, height }) {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));

  const latitude = toNumber(vehicle?.lat);
  const longitude = toNumber(vehicle?.lng);
  const hasLocation = latitude !== null && longitude !== null;
  const course = toNumber(vehicle?.course ?? vehicle?.details?.course) || 0;
  const statusColor = getStatusColor(vehicle?.status, colors);

  const mapRef = useRef(null);
  const markerCoordinate = useRef(null);
  const lastUpdateAt = useRef(Date.now());
  const averageGapMs = useRef(MIN_GLIDE_MS * 2);
  const isFirstPosition = useRef(true);
  const isFollowingRef = useRef(true);
  const [isFollowing, setIsFollowing] = useState(true);
  const [trail, setTrail] = useState([]);
  const [isTrackingView, setIsTrackingView] = useState(true);

  // The marker position is an animated value, created once at the first known position
  if (!markerCoordinate.current && hasLocation) {
    markerCoordinate.current = new AnimatedRegion({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0 });
  }

  // A new live position arrives: glide the marker there over about the time between updates,
  // so it keeps moving smoothly instead of jumping.
  useEffect(() => {
    if (!hasLocation || !markerCoordinate.current) {
      return;
    }
    if (isFirstPosition.current) {
      isFirstPosition.current = false;
      lastUpdateAt.current = Date.now();
      return;
    }
    const now = Date.now();
    averageGapMs.current = averageGapMs.current * 0.5 + (now - lastUpdateAt.current) * 0.5;
    lastUpdateAt.current = now;
    const duration = Math.min(Math.max(averageGapMs.current, MIN_GLIDE_MS), MAX_GLIDE_MS);

    markerCoordinate.current
      .timing({ latitude, longitude, latitudeDelta: 0, longitudeDelta: 0, duration, easing: Easing.linear, useNativeDriver: false })
      .start();
    setTrail((previous) => [...previous, { latitude, longitude }].slice(-MAX_TRAIL_POINTS));

    // Camera follows at the same pace and keeps the user's zoom
    if (isFollowingRef.current) {
      mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration });
    }
  }, [latitude, longitude, hasLocation]);

  // The marker is drawn as a picture; refresh that picture briefly when its color changes
  useEffect(() => {
    setIsTrackingView(true);
    const timer = setTimeout(() => setIsTrackingView(false), 600);
    return () => clearTimeout(timer);
  }, [statusColor]);

  const tailCoordinates = useMemo(() => (vehicle?.details?.tail || []).map(toCoordinate), [vehicle?.details?.tail]);
  const pathCoordinates = useMemo(() => [...tailCoordinates, ...trail], [tailCoordinates, trail]);

  const stopFollowing = () => {
    isFollowingRef.current = false;
    setIsFollowing(false);
  };

  const startFollowing = () => {
    isFollowingRef.current = true;
    setIsFollowing(true);
    if (hasLocation) {
      mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration: 500 });
    }
  };

  if (!hasLocation) {
    return (
      <View style={[styles.container, styles.noLocation, { height }]}>
        <AppText color={colors.textSecondary}>No location yet for this vehicle</AppText>
      </View>
    );
  }

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: START_DELTA, longitudeDelta: START_DELTA }}
        customMapStyle={isDark ? darkMapStyle : undefined}
        rotateEnabled={false}
        pitchEnabled={false}
        toolbarEnabled={false}
        onPanDrag={stopFollowing}
      >
        {pathCoordinates.length > 1 && (
          <Polyline coordinates={pathCoordinates} strokeColor={statusColor} strokeWidth={4} />
        )}
        <MarkerAnimated
          coordinate={markerCoordinate.current}
          anchor={{ x: 0.5, y: 0.5 }}
          flat
          rotation={course}
          tracksViewChanges={isTrackingView}
        >
          <View style={[styles.marker, { backgroundColor: statusColor }]}>
            <Icon source="navigation" size={22} color={colors.textOnPrimary} />
          </View>
        </MarkerAnimated>
      </MapView>
      <IconButton
        icon="crosshairs-gps"
        size={22}
        iconColor={isFollowing ? colors.textOnPrimary : colors.primary}
        containerColor={isFollowing ? colors.primary : colors.surface}
        style={styles.followButton}
        accessibilityLabel="Follow this vehicle"
        onPress={startFollowing}
      />
    </View>
  );
}
