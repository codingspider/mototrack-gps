// Live map for one vehicle. The marker glides between live positions (never jumps), points the way the
// vehicle heads and takes its color from the status. Buttons on the map: map style, draw geofence,
// Street View pop up, my location and the tracker's location.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import MapView, { MarkerAnimated, Polyline, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { Icon } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../common/AppText';
import useSmoothVehicle from '../../hooks/useSmoothVehicle';
import useVehicleHeading from '../../hooks/useVehicleHeading';
import { createGeofence, selectIsSavingGeofence } from '../../store/slices/geofencesSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { showToast } from '../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import { buildGeofencePayload } from '../../utils/geofence';
import { getVehicleIconUrl, shouldRotateIcon } from '../../utils/vehicleIcon';
import { getStatusColor, getStatusGroup } from '../../utils/vehicleStatus';
import RadarPulse from './RadarPulse';
import VehicleIcon from '../vehicle/VehicleIcon';
import darkMapStyle from './darkMapStyle';
import GeofenceDraft from './GeofenceDraft';
import GeofenceNameModal from './GeofenceNameModal';
import GeofenceToolbar from './GeofenceToolbar';
import MapTypeMenu from './MapTypeMenu';
import StreetViewModal from './StreetViewModal';
import VehicleMapControls from './VehicleMapControls';

const START_DELTA = 0.01; // zoom when the map opens
const OFF_CENTER_RATIO = 0.15; // the vehicle may drift this far (share of the view) before it is re-centred
const METERS_PER_DEGREE = 111320;
const RADAR_SHARE_OF_VIEW = 0.22; // a radar ring grows to this share of the map height
const MARKER_SIZE = 44;
const MARKER_ICON_HEIGHT = 30;
const MARKER_REFRESH_MAX_MS = 3000; // stop refreshing the marker picture after this, even if the download is slow
const MARKER_SETTLE_MS = 200;
// OpenStreetMap tiles from OpenStreetMap France. OpenStreetMap's own server blocks apps (403 "Access blocked"),
// because react-native-maps cannot send the identification it requires, and CARTO's free tiles now need a key.
// This server is for light use only: for a busy app, switch to a paid tile plan (MapTiler, Stadia, Thunderforest...).
const OSM_TILE_URL = 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const OSM_CREDIT = '© OpenStreetMap contributors, HOT';

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
    menu: { position: 'absolute', top: 56, left: 56 },
    credit: {
      position: 'absolute',
      left: spacing.sm,
      bottom: spacing.xs,
      paddingHorizontal: spacing.xs,
      borderRadius: radius.sm,
      backgroundColor: colors.surface,
      opacity: 0.85,
    },
  });

const toNumber = (value) => (value === null || value === undefined || value === '' ? null : Number(value));
const toCoordinate = (point) => ({ latitude: Number(point.lat), longitude: Number(point.lng) });

/**
 * @param {number} vehicleId Vehicle id (the vehicle is read from Redux, so it moves live)
 * @param {number} height Map height
 */
export default function VehicleMap({ vehicleId, height }) {
  const dispatch = useDispatch();
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const isSavingGeofence = useSelector(selectIsSavingGeofence);

  const latitude = toNumber(vehicle?.lat);
  const longitude = toNumber(vehicle?.lng);
  const hasLocation = latitude !== null && longitude !== null;
  const course = toNumber(vehicle?.course ?? vehicle?.details?.course) || 0;
  const statusColor = getStatusColor(vehicle?.status, colors);

  const mapRef = useRef(null);
  const isFollowingRef = useRef(true);
  const userLocationRef = useRef(null);
  const shouldGoToUserRef = useRef(false);
  const [isFollowing, setIsFollowing] = useState(true);
  const [mapType, setMapType] = useState('standard');
  const [isMapTypeOpen, setIsMapTypeOpen] = useState(false);
  const [showsUserLocation, setShowsUserLocation] = useState(false);
  const [isStreetViewOpen, setIsStreetViewOpen] = useState(false);
  const [isDrawing, setIsDrawing] = useState(false);
  const [drawPoints, setDrawPoints] = useState([]);
  const [isNaming, setIsNaming] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const [visibleMeters, setVisibleMeters] = useState(START_DELTA * METERS_PER_DEGREE); // map height in meters

  const { markerCoordinate, trail } = useSmoothVehicle(latitude, longitude, mapRef, isFollowingRef);
  const heading = useVehicleHeading(latitude, longitude, course);

  // The marker is drawn as a picture of its view. Keep it fresh while the vehicle picture downloads or the
  // status color changes, then stop (it is much cheaper that way).
  const iconUrl = getVehicleIconUrl(vehicle);
  const [isTrackingView, setIsTrackingView] = useState(true);
  useEffect(() => {
    setIsTrackingView(true);
    const timer = setTimeout(() => setIsTrackingView(false), MARKER_REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, [statusColor, iconUrl]);
  const handleIconLoaded = () => setTimeout(() => setIsTrackingView(false), MARKER_SETTLE_MS);

  // Rotating and arrow pictures turn to face the heading; other pictures stay upright
  const markerRotation = iconUrl && !shouldRotateIcon(vehicle) ? 0 : heading;

  const tailCoordinates = useMemo(() => (vehicle?.details?.tail || []).map(toCoordinate), [vehicle?.details?.tail]);
  const pathCoordinates = useMemo(() => [...tailCoordinates, ...trail], [tailCoordinates, trail]);

  const setFollowing = (value) => {
    isFollowingRef.current = value;
    setIsFollowing(value);
  };

  // ---- Buttons ----
  const goToTracker = () => {
    setFollowing(true);
    if (hasLocation) {
      mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration: 500 });
    }
  };

  const goToMyLocation = async () => {
    if (userLocationRef.current && showsUserLocation) {
      setFollowing(false);
      mapRef.current?.animateCamera({ center: userLocationRef.current }, { duration: 500 });
      return;
    }
    if (Platform.OS === 'android') {
      const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION);
      if (result !== PermissionsAndroid.RESULTS.GRANTED) {
        dispatch(showToast({ type: 'warning', message: 'Allow location permission to see where you are' }));
        return;
      }
    }
    shouldGoToUserRef.current = true; // move the camera as soon as the first position arrives
    setShowsUserLocation(true);
  };

  const handleUserLocation = (event) => {
    const coordinate = event?.nativeEvent?.coordinate;
    if (!coordinate) {
      return; // the phone has no location fix yet
    }
    userLocationRef.current = coordinate;
    if (shouldGoToUserRef.current) {
      shouldGoToUserRef.current = false;
      setFollowing(false);
      mapRef.current?.animateCamera({ center: userLocationRef.current }, { duration: 500 });
    }
  };

  // Zoom in / out keeps the vehicle's current position in the centre of the map
  const zoomBy = async (step) => {
    const camera = await mapRef.current?.getCamera();
    if (!camera) {
      return;
    }
    setFollowing(true);
    mapRef.current.animateCamera({ center: { latitude, longitude }, zoom: camera.zoom + step }, { duration: 300 });
  };

  const resetNorth = () => mapRef.current?.animateCamera({ heading: 0 }, { duration: 300 });

  // After every move, pinch or rotate: remember the map's rotation (for the compass button) and, while
  // following, pull the vehicle back to the centre so a pinch zoom stays on the vehicle.
  const handleRegionChangeComplete = async (region) => {
    setVisibleMeters(region.latitudeDelta * METERS_PER_DEGREE); // radar rings scale with the zoom
    const camera = await mapRef.current?.getCamera();
    setMapHeading(camera?.heading || 0);
    if (!isFollowingRef.current) {
      return;
    }
    const isOffCenter =
      Math.abs(region.latitude - latitude) > region.latitudeDelta * OFF_CENTER_RATIO ||
      Math.abs(region.longitude - longitude) > region.longitudeDelta * OFF_CENTER_RATIO;
    if (isOffCenter) {
      mapRef.current?.animateCamera({ center: { latitude, longitude } }, { duration: 250 });
    }
  };

  const chooseMapType = (key) => {
    setMapType(key);
    setIsMapTypeOpen(false);
  };

  const startDrawing = () => {
    setIsMapTypeOpen(false);
    setFollowing(false);
    setDrawPoints([]);
    setIsDrawing(true);
  };

  // Read the tapped spot right away: the event object is released after this handler returns
  const addDrawPoint = (event) => {
    const coordinate = event.nativeEvent.coordinate;
    setDrawPoints((points) => [...points, coordinate]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsNaming(false);
    setDrawPoints([]);
  };

  const saveGeofence = async (name) => {
    const payload = buildGeofencePayload(name, drawPoints, colors.secondary);
    try {
      await dispatch(createGeofence(payload)).unwrap();
      dispatch(showToast({ type: 'success', message: 'Geofence saved' }));
      stopDrawing();
    } catch (message) {
      dispatch(showToast({ type: 'error', message: String(message) }));
    }
  };

  if (!hasLocation) {
    return (
      <View style={[styles.container, styles.noLocation, { height }]}>
        <AppText color={colors.textSecondary}>No location yet for this vehicle</AppText>
      </View>
    );
  }

  const isOpenStreetMap = mapType === 'osm';

  return (
    <View style={[styles.container, { height }]}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={{ latitude, longitude, latitudeDelta: START_DELTA, longitudeDelta: START_DELTA }}
        mapType={isOpenStreetMap ? 'none' : mapType}
        customMapStyle={isDark && mapType === 'standard' ? darkMapStyle : undefined}
        showsUserLocation={showsUserLocation}
        showsMyLocationButton={false}
        onUserLocationChange={handleUserLocation}
        rotateEnabled
        pitchEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={() => setFollowing(false)}
        onPress={isDrawing ? addDrawPoint : undefined}
      >
        {isOpenStreetMap && <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} />}
        {pathCoordinates.length > 1 && <Polyline coordinates={pathCoordinates} strokeColor={statusColor} strokeWidth={4} />}
        <RadarPulse
          coordinate={markerCoordinate}
          color={statusColor}
          maxMeters={visibleMeters * RADAR_SHARE_OF_VIEW}
          isActive={!!markerCoordinate && !isDrawing && getStatusGroup(vehicle?.status) !== 'offline'}
        />
        {!!markerCoordinate && (
          <MarkerAnimated coordinate={markerCoordinate} anchor={{ x: 0.5, y: 0.5 }} flat rotation={markerRotation} tracksViewChanges={isTrackingView}>
            <View style={[styles.marker, { backgroundColor: statusColor }]}>
              {iconUrl ? (
                <VehicleIcon vehicle={vehicle} height={MARKER_ICON_HEIGHT} onLoadEnd={handleIconLoaded} />
              ) : (
                <Icon source="navigation" size={22} color={colors.textOnPrimary} />
              )}
            </View>
          </MarkerAnimated>
        )}
        {isDrawing && <GeofenceDraft points={drawPoints} />}
      </MapView>

      {isDrawing ? (
        <GeofenceToolbar
          pointCount={drawPoints.length}
          onUndo={() => setDrawPoints((points) => points.slice(0, -1))}
          onClear={() => setDrawPoints([])}
          onCancel={stopDrawing}
          onDone={() => setIsNaming(true)}
        />
      ) : (
        <VehicleMapControls
          isMapTypeOpen={isMapTypeOpen}
          showsUserLocation={showsUserLocation}
          isFollowing={isFollowing}
          isRotated={Math.abs(mapHeading) > 1}
          onResetNorth={resetNorth}
          onZoomIn={() => zoomBy(1)}
          onZoomOut={() => zoomBy(-1)}
          onMapType={() => setIsMapTypeOpen((isOpen) => !isOpen)}
          onGeofence={startDrawing}
          onStreetView={() => setIsStreetViewOpen(true)}
          onMyLocation={goToMyLocation}
          onTrackerLocation={goToTracker}
        />
      )}
      {isOpenStreetMap && (
        <View style={styles.credit} pointerEvents="none">
          <AppText variant="caption" color={colors.textSecondary}>
            {OSM_CREDIT}
          </AppText>
        </View>
      )}
      {isMapTypeOpen && !isDrawing && (
        <View style={styles.menu}>
          <MapTypeMenu selected={mapType} onSelect={chooseMapType} />
        </View>
      )}

      <StreetViewModal
        visible={isStreetViewOpen}
        onDismiss={() => setIsStreetViewOpen(false)}
        latitude={latitude}
        longitude={longitude}
        course={course}
      />
      <GeofenceNameModal
        visible={isNaming}
        isSaving={isSavingGeofence}
        onSave={saveGeofence}
        onDismiss={() => setIsNaming(false)}
        onInvalid={() => dispatch(showToast({ type: 'warning', message: 'Enter a name for the geofence' }))}
      />
    </View>
  );
}
