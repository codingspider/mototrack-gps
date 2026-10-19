// Live map for one vehicle. The marker glides between live positions (never jumps), points the way the
// vehicle heads and takes its color from the status. Buttons on the map: map style, draw geofence, vehicle
// name on / off, Street View pop up, my location and the tracker's location.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import MapView, { MarkerAnimated, Polyline, PROVIDER_GOOGLE, UrlTile } from 'react-native-maps';
import { Icon } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../common/AppText';
import useSmoothVehicle from '../../hooks/useSmoothVehicle';
import useVehicleHeading from '../../hooks/useVehicleHeading';
import useVehicleIconSize from '../../hooks/useVehicleIconSize';
import useVehicleLabelSetting from '../../hooks/useVehicleLabelSetting';
import useMapTailSetting from '../../hooks/useMapTailSetting';
import useMapTrafficSetting from '../../hooks/useMapTrafficSetting';
import useSnappedPath from '../../hooks/useSnappedPath';
import { saveVehicleGeofence, selectIsSavingGeofence } from '../../store/slices/geofencesSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { showToast } from '../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import { getVehicleIconUrl, shouldRotateIcon } from '../../utils/vehicleIcon';
import { getStatusColor, getStatusGroup } from '../../utils/vehicleStatus';
import { getVehicleCoordinate } from '../../utils/vehicleFilter';
import { attachTailToMarker, buildTailPath, orderTail } from '../../utils/tailPath';
import { DEFAULT_CIRCLE_RADIUS, stepCircleRadius } from '../../utils/geofence';
import NoLocationPanel from './NoLocationPanel';
import RadarPulse from './RadarPulse';
import VehicleIcon from '../vehicle/VehicleIcon';
import VehicleLabelMarker from './VehicleLabelMarker';
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
const RADAR_SHARE_OF_VIEW = 0.12; // a radar ring grows to this share of the map height
const MARKER_SIZE = 44;
const MARKER_ICON_HEIGHT = 30;
const MARKER_REFRESH_MAX_MS = 3000; // stop refreshing the marker picture after this, even if the download is slow
const MARKER_SETTLE_MS = 200;
const MARKER_SAMPLE_MS = 500; // how often the tail's end is moved to where the gliding marker is
const AUTO_FOLLOW_AFTER_MS = 8000; // a moving vehicle is followed again this long after the user last moved the map
const KEEP_IN_VIEW_SHARE = 0.35; // while following, a marker farther than this from the middle is brought back
// OpenStreetMap tiles from OpenStreetMap France. OpenStreetMap's own server blocks apps (403 "Access blocked"),
// because react-native-maps cannot send the identification it requires, and CARTO's free tiles now need a key.
// This server is for light use only: for a busy app, switch to a paid tile plan (MapTiler, Stadia, Thunderforest...).
const OSM_TILE_URL = 'https://tile-a.openstreetmap.fr/hot/{z}/{x}/{y}.png';
const OSM_CREDIT = '© OpenStreetMap contributors, HOT';

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { overflow: 'hidden', backgroundColor: colors.skeleton },
    marker: {
      width: MARKER_SIZE,
      height: MARKER_SIZE,
      alignItems: 'center',
      justifyContent: 'center',
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

/**
 * @param {number} vehicleId Vehicle id (the vehicle is read from Redux, so it moves live)
 * @param {number} height Map height
 * @param {Animated.Value|Animated.AnimatedInterpolation} controlsLift Negative pixels that lift the bottom buttons
 *   (they ride above the details sheet)
 */
export default function VehicleMap({ vehicleId, height, controlsLift }) {
  const dispatch = useDispatch();
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const isSavingGeofence = useSelector(selectIsSavingGeofence);
  const { isLabelShown, toggleLabel } = useVehicleLabelSetting();
  const { isTailShown, toggleTail } = useMapTailSetting(); // the tail button on the map, remembered on the phone
  const { isTrafficShown, toggleTraffic } = useMapTrafficSetting(); // Google's live traffic colours on the roads
  const { scale: iconScale } = useVehicleIconSize(); // chosen in Profile > Vehicle icon size

  // 0,0 is what a tracker without a GPS fix sends: treat it as "no location", never as a point off Africa
  const coordinate = getVehicleCoordinate(vehicle);
  const latitude = coordinate ? coordinate.latitude : null;
  const longitude = coordinate ? coordinate.longitude : null;
  const hasLocation = coordinate !== null;
  const course = toNumber(vehicle?.course ?? vehicle?.details?.course) || 0;
  const statusColor = getStatusColor(vehicle?.status, colors);
  const isMoving = getStatusGroup(vehicle?.status) === 'moving';

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
  const [drawShape, setDrawShape] = useState('polygon'); // 'polygon' | 'circle'
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(DEFAULT_CIRCLE_RADIUS);
  const [isNaming, setIsNaming] = useState(false);
  const [mapHeading, setMapHeading] = useState(0);
  const [visibleMeters, setVisibleMeters] = useState(START_DELTA * METERS_PER_DEGREE); // map height in meters

  const { markerCoordinate, trail } = useSmoothVehicle(latitude, longitude, mapRef, isFollowingRef);
  const heading = useVehicleHeading(latitude, longitude, course);

  // Where the marker is drawn right now (it glides behind the newest live point), checked twice a second
  const [markerSpot, setMarkerSpot] = useState(null);
  useEffect(() => {
    if (!markerCoordinate) {
      return undefined;
    }
    const timer = setInterval(() => {
      const value = markerCoordinate.__getValue();
      setMarkerSpot((previous) =>
        previous && previous.latitude === value.latitude && previous.longitude === value.longitude
          ? previous
          : { latitude: value.latitude, longitude: value.longitude },
      );
    }, MARKER_SAMPLE_MS);
    return () => clearInterval(timer);
  }, [markerCoordinate]);

  // The marker is drawn as a picture of its view. Keep it fresh while the vehicle picture downloads or the
  // status color changes, then stop (it is much cheaper that way).
  const iconUrl = getVehicleIconUrl(vehicle);
  const [isTrackingView, setIsTrackingView] = useState(true);
  useEffect(() => {
    setIsTrackingView(true);
    const timer = setTimeout(() => setIsTrackingView(false), MARKER_REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, [statusColor, iconUrl, iconScale]);
  const handleIconLoaded = () => setTimeout(() => setIsTrackingView(false), MARKER_SETTLE_MS);

  // Rotating and arrow pictures turn to face the heading; other pictures stay upright
  const markerRotation = iconUrl && !shouldRotateIcon(vehicle) ? 0 : heading;

  // The tail: the server's recent points in driving order, then the live points, without repeats (no zig-zag),
  // moved onto the roads by Google Roads API (raw points until it answers, or if it cannot)
  const tailPoints = useMemo(
    () => orderTail(vehicle?.details?.tail, latitude === null ? null : { latitude, longitude }),
    [vehicle?.details?.tail, latitude, longitude],
  );
  const rawPath = useMemo(() => buildTailPath(tailPoints, trail), [tailPoints, trail]);
  const snappedPath = useSnappedPath(rawPath, isTailShown);
  // The line always ends at the vehicle picture: the part it has not driven yet is left off
  const pathCoordinates = useMemo(
    () => attachTailToMarker(snappedPath, markerSpot, latitude === null ? null : { latitude, longitude }),
    [snappedPath, markerSpot, latitude, longitude],
  );

  // Auto follow: a moving vehicle is followed again a few seconds after the user moved the map away, and kept in
  // view while it is followed (so it never drives off the side of the screen)
  const lastTouchAtRef = useRef(0);
  const lastRegionRef = useRef(null);
  const autoFollowRef = useRef({ isMoving, isDrawing: false });

  const setFollowing = (value) => {
    isFollowingRef.current = value;
    setIsFollowing(value);
  };

  autoFollowRef.current = { isMoving, isDrawing };
  useEffect(() => {
    const timer = setInterval(() => {
      const { isMoving: moving, isDrawing: drawing } = autoFollowRef.current;
      const marker = markerCoordinate && markerCoordinate.__getValue();
      if (!moving || drawing || !marker) {
        return;
      }
      const center = { latitude: marker.latitude, longitude: marker.longitude };
      if (!isFollowingRef.current) {
        if (Date.now() - lastTouchAtRef.current > AUTO_FOLLOW_AFTER_MS) {
          isFollowingRef.current = true;
          setIsFollowing(true);
          mapRef.current?.animateCamera({ center }, { duration: 600 });
        }
        return;
      }
      const region = lastRegionRef.current;
      const isNearEdge =
        region &&
        (Math.abs(region.latitude - center.latitude) > region.latitudeDelta * KEEP_IN_VIEW_SHARE ||
          Math.abs(region.longitude - center.longitude) > region.longitudeDelta * KEEP_IN_VIEW_SHARE);
      if (isNearEdge) {
        mapRef.current?.animateCamera({ center }, { duration: 600 });
      }
    }, 1000);
    return () => clearInterval(timer);
  }, [markerCoordinate]);

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
    const phoneSpot = event?.nativeEvent?.coordinate;
    if (!phoneSpot) {
      return; // the phone has no location fix yet
    }
    userLocationRef.current = phoneSpot;
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
    lastRegionRef.current = region; // what is on screen now (auto follow keeps the vehicle inside it)
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
    setCircleCenter(null);
    setIsDrawing(true);
  };

  // Read the tapped spot right away: the event object is released after this handler returns.
  // A polygon gets a new corner; a circle is placed (or moved) there.
  const addDrawPoint = (event) => {
    const tapped = event.nativeEvent.coordinate;
    if (drawShape === 'circle') {
      setCircleCenter(tapped);
      return;
    }
    setDrawPoints((points) => [...points, tapped]);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
    setIsNaming(false);
    setDrawPoints([]);
    setCircleCenter(null);
  };

  const saveGeofence = async (name) => {
    try {
      // Saves the area and links it to this vehicle (alert when it leaves); the Geofence page can change that later
      await dispatch(
        saveVehicleGeofence({
          deviceId: vehicleId,
          geofenceId: null,
          name,
          color: colors.secondary,
          points: drawPoints,
          circle: drawShape === 'circle' && circleCenter ? { ...circleCenter, radius: circleRadius } : null,
          zone: 'out',
        }),
      ).unwrap();
      dispatch(showToast({ type: 'success', message: 'Geofence saved' }));
      stopDrawing();
    } catch (message) {
      dispatch(showToast({ type: 'error', message: String(message) }));
    }
  };

  if (!hasLocation) {
    return (
      <View style={[styles.container, { height }]}>
        <NoLocationPanel vehicle={vehicle} height={height} />
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
        showsTraffic={isTrafficShown && !isOpenStreetMap}
        showsMyLocationButton={false}
        onUserLocationChange={handleUserLocation}
        rotateEnabled
        pitchEnabled={false}
        toolbarEnabled={false}
        onRegionChangeComplete={handleRegionChangeComplete}
        onPanDrag={() => {
          lastTouchAtRef.current = Date.now();
          setFollowing(false);
        }}
        onPress={isDrawing ? addDrawPoint : undefined}
      >
        {isOpenStreetMap && <UrlTile urlTemplate={OSM_TILE_URL} maximumZ={19} />}
        {isTailShown && pathCoordinates.length > 1 && (
          <Polyline coordinates={pathCoordinates} strokeColor={statusColor} strokeWidth={4} lineJoin="round" lineCap="round" />
        )}
        <RadarPulse
          coordinate={markerCoordinate}
          color={statusColor}
          maxMeters={visibleMeters * RADAR_SHARE_OF_VIEW}
          isActive={!!markerCoordinate && !isDrawing && isMoving}
        />
        {!!markerCoordinate && (
          <MarkerAnimated coordinate={markerCoordinate} anchor={{ x: 0.5, y: 0.5 }} flat rotation={markerRotation} tracksViewChanges={isTrackingView}>
            <View style={[styles.marker, { width: MARKER_SIZE * iconScale, height: MARKER_SIZE * iconScale }]}>
              {iconUrl ? (
                <VehicleIcon vehicle={vehicle} height={MARKER_ICON_HEIGHT * iconScale} onLoadEnd={handleIconLoaded} />
              ) : (
                <Icon source="navigation" size={(MARKER_SIZE / 2) * iconScale} color={statusColor} />
              )}
            </View>
          </MarkerAnimated>
        )}
        {isLabelShown && !isDrawing && (
          <VehicleLabelMarker coordinate={markerCoordinate} text={vehicle.plate_number || vehicle.device_name} />
        )}
        {isDrawing && (
          <GeofenceDraft points={drawPoints} shape={drawShape} circleCenter={circleCenter} circleRadius={circleRadius} />
        )}
      </MapView>

      {isDrawing ? (
        <GeofenceToolbar
          shape={drawShape}
          onShapeChange={setDrawShape}
          pointCount={drawPoints.length}
          hasCenter={!!circleCenter}
          radiusMeters={circleRadius}
          onRadiusStep={(direction) => setCircleRadius((current) => stepCircleRadius(current, direction))}
          onUndo={() => setDrawPoints((points) => points.slice(0, -1))}
          onClear={() => (drawShape === 'circle' ? setCircleCenter(null) : setDrawPoints([]))}
          onCancel={stopDrawing}
          onDone={() => setIsNaming(true)}
        />
      ) : (
        <VehicleMapControls
          bottomLift={controlsLift}
          isMapTypeOpen={isMapTypeOpen}
          showsUserLocation={showsUserLocation}
          isFollowing={isFollowing}
          isRotated={Math.abs(mapHeading) > 1}
          isLabelShown={isLabelShown}
          onToggleLabel={toggleLabel}
          isTailShown={isTailShown}
          onToggleTail={toggleTail}
          isTrafficShown={isTrafficShown}
          onToggleTraffic={toggleTraffic}
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
