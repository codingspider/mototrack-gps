// The playback map: the whole route, the part already driven, start / end / parking markers and the moving vehicle.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Callout, Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon } from 'react-native-paper';
import darkMapStyle from '../../../components/map/darkMapStyle';
import MapControlButton from '../../../components/map/MapControlButton';
import VehicleIcon from '../../../components/vehicle/VehicleIcon';
import useAddress from '../../../hooks/useAddress';
import { formatBdTime } from '../../../utils/formatDate';
import { formatDuration } from '../../../utils/playbackStats';
import { shouldRotateIcon } from '../../../utils/vehicleIcon';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const FIT_PADDING = { top: 60, right: 60, bottom: 60, left: 60 };
const FOLLOW_EVERY_MS = 500; // the camera follows this often, so a fast replay does not make it dizzy
const MARKER_SIZE = 40;
const PIN_SIZE = 28;
const CALLOUT_WIDTH = 240; // the address wraps onto as many lines as it needs inside this width

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { overflow: 'hidden', backgroundColor: colors.skeleton },
    buttons: { position: 'absolute', top: spacing.sm, right: spacing.sm, gap: spacing.sm },
    vehicle: {
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.textOnPrimary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 4,
    },
    callout: {
      width: CALLOUT_WIDTH,
      padding: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
    },
    calloutTitle: { color: colors.text, fontWeight: '800', fontSize: 13 },
    calloutText: { color: colors.textSecondary, fontSize: 12, marginTop: 2 },
    pin: {
      width: PIN_SIZE,
      height: PIN_SIZE,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.textOnPrimary,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

const toCoordinate = (point) => ({ latitude: Number(point.lat), longitude: Number(point.lng) });

/**
 * A marker that is drawn once (its picture is taken after a moment, then it is left alone). Tapping it opens a small
 * box with what it is (`title`) and where: the address is looked up on the first tap, so the map does not ask the
 * server for every pin of a long trip.
 */
function PinMarker({ coordinate, title, children }) {
  const styles = useThemedStyles(makeStyles);
  const markerRef = useRef(null);
  const [isTracking, setIsTracking] = useState(true);
  const [wantsAddress, setWantsAddress] = useState(false);
  const address = useAddress('', wantsAddress ? coordinate.latitude : null, wantsAddress ? coordinate.longitude : null);
  useEffect(() => {
    const timer = setTimeout(() => setIsTracking(false), 800);
    return () => clearTimeout(timer);
  }, []);
  // The box is already open when the address arrives: open it again so it shows the new text
  useEffect(() => {
    if (wantsAddress && markerRef.current) {
      markerRef.current.showCallout();
    }
  }, [address, wantsAddress]);
  let description = 'Tap to see the place';
  if (wantsAddress) {
    description = address || 'Looking up the address…';
  }
  return (
    <Marker
      ref={markerRef}
      coordinate={coordinate}
      anchor={{ x: 0.5, y: 0.5 }}
      tracksViewChanges={isTracking}
      onPress={() => setWantsAddress(true)}
    >
      {children}
      {/* Our own card instead of the map's one-line box, so a long address breaks into several lines */}
      <Callout tooltip>
        <View style={styles.callout}>
          <Text style={styles.calloutTitle}>{title}</Text>
          <Text style={styles.calloutText}>{description}</Text>
        </View>
      </Callout>
    </Marker>
  );
}

/**
 * @param {object} vehicle Vehicle from Redux (for its picture)
 * @param {Array} points Playback points
 * @param {Array} stops Stops from findStops
 * @param {object} position Where the vehicle is now: { latitude, longitude, heading, index }
 * @param {boolean} isFullscreen The map fills the page
 * @param {function} onToggleFullscreen
 * @param {number} height Map height (ignored while fullscreen)
 */
export default function PlaybackMap({ vehicle, points, stops, position, isFullscreen, onToggleFullscreen, height }) {
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const mapRef = useRef(null);
  const lastFollowAt = useRef(0);
  const [isFollowing, setIsFollowing] = useState(false);
  // The vehicle marker is a picture of its view: keep it fresh until the vehicle picture has downloaded
  const [isVehicleTracking, setIsVehicleTracking] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsVehicleTracking(false), 3000);
    return () => clearTimeout(timer);
  }, []);

  const route = useMemo(() => points.map(toCoordinate), [points]);
  const index = position ? position.index : 0;
  const driven = useMemo(() => {
    const done = route.slice(0, index + 1);
    return position ? [...done, { latitude: position.latitude, longitude: position.longitude }] : done;
    // Redraw the driven line only when the vehicle passes a recorded point
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, index]);

  const fitRoute = () => {
    if (route.length > 1) {
      mapRef.current?.fitToCoordinates(route, { edgePadding: FIT_PADDING, animated: true });
    }
  };

  // Show the whole route when it loads or the map size changes
  useEffect(() => {
    const timer = setTimeout(fitRoute, 400);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [route, isFullscreen, height]);

  // Follow mode: keep the vehicle in the middle
  useEffect(() => {
    if (!isFollowing || !position || Date.now() - lastFollowAt.current < FOLLOW_EVERY_MS) {
      return;
    }
    lastFollowAt.current = Date.now();
    mapRef.current?.animateCamera({ center: { latitude: position.latitude, longitude: position.longitude } }, { duration: FOLLOW_EVERY_MS });
  }, [isFollowing, position]);

  const start = route[0];
  const end = route[route.length - 1];
  const rotation = shouldRotateIcon(vehicle) && position ? position.heading : 0;

  return (
    <View style={[styles.container, isFullscreen ? StyleSheet.absoluteFill : { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        customMapStyle={isDark ? darkMapStyle : undefined}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        rotateEnabled={false}
        pitchEnabled={false}
        onPanDrag={() => setIsFollowing(false)}
      >
        {route.length > 1 && <Polyline coordinates={route} strokeColor={colors.textMuted} strokeWidth={5} />}
        {driven.length > 1 && <Polyline coordinates={driven} strokeColor={colors.statusMoving} strokeWidth={6} zIndex={2} />}
        {start && (
          <PinMarker coordinate={start} title={`Trip started · ${formatBdTime(points[0].timestamp)}`}>
            <View style={[styles.pin, { backgroundColor: colors.statusMoving }]}>
              <Icon source="flag-variant" size={14} color={colors.textOnPrimary} />
            </View>
          </PinMarker>
        )}
        {end && route.length > 1 && (
          <PinMarker coordinate={end} title={`Trip ended · ${formatBdTime(points[points.length - 1].timestamp)}`}>
            <View style={[styles.pin, { backgroundColor: colors.secondary }]}>
              <Icon source="stop" size={14} color={colors.textOnPrimary} />
            </View>
          </PinMarker>
        )}
        {stops.map((stop) => (
          <PinMarker
            key={stop.startTime}
            coordinate={{ latitude: stop.latitude, longitude: stop.longitude }}
            title={`Parked ${formatDuration(stop.seconds)} · ${formatBdTime(stop.startTime)}`}
          >
            <View style={[styles.pin, { backgroundColor: colors.accent }]}>
              <Icon source="alpha-p" size={16} color={colors.textOnPrimary} />
            </View>
          </PinMarker>
        ))}
        {position && (
          <Marker
            coordinate={{ latitude: position.latitude, longitude: position.longitude }}
            anchor={{ x: 0.5, y: 0.5 }}
            flat
            rotation={rotation}
            zIndex={5}
            tracksViewChanges={isVehicleTracking}
          >
            <View style={[styles.vehicle, { backgroundColor: colors.statusMoving }]}>
              <VehicleIcon vehicle={vehicle} height={28} onLoadEnd={() => setTimeout(() => setIsVehicleTracking(false), 300)} />
            </View>
          </Marker>
        )}
      </MapView>
      <View style={styles.buttons}>
        <MapControlButton icon="map-marker-path" label="Show the whole route" onPress={fitRoute} />
        <MapControlButton icon={isFullscreen ? 'fullscreen-exit' : 'fullscreen'} label="Full screen" isActive={isFullscreen} onPress={onToggleFullscreen} />
        <MapControlButton icon="target" label="Follow the vehicle" isActive={isFollowing} onPress={() => setIsFollowing((value) => !value)} />
      </View>
    </View>
  );
}
