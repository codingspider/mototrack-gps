// Add or edit a geofence of one vehicle: tap the map to draw the area, name it, choose when to alert, save.
// Opens with `{ vehicleId, geofenceId? }`. The area is a polygon (tap its corners) or a circle (tap its centre, size it
// with − / +); a geofence can be changed from one to the other. The map fills the page; the form sits in a panel over
// it that swipes up (whole form) and down (bigger map to draw on).
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import GeofenceDraft from '../../components/map/GeofenceDraft';
import GeofenceShapeControls from '../../components/map/GeofenceShapeControls';
import {
  fetchGeofences,
  fetchVehicleGeofences,
  saveVehicleGeofence,
  selectGeofenceZones,
  selectIsSavingGeofence,
  selectVehicleLinks,
} from '../../store/slices/geofencesSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import {
  DEFAULT_CIRCLE_RADIUS,
  MIN_GEOFENCE_POINTS,
  getCenter,
  getCircle,
  parseCoordinates,
  stepCircleRadius,
} from '../../utils/geofence';
import { isBlank } from '../../utils/validators';
import { GEOFENCE_COLORS, spacing, useAppTheme, useThemedStyles } from '../../theme';
import EditorSheet from './components/EditorSheet';
import GeofenceForm from './components/GeofenceForm';

const START_DELTA = 0.01;
const FALLBACK_REGION = { latitude: 23.8, longitude: 90.4 };
const SHEET_MAX_SHARE = 0.7; // the open panel covers at most this share of the page

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    bar: { paddingLeft: spacing.md, paddingRight: spacing.sm, paddingBottom: spacing.sm, backgroundColor: colors.surface },
    barRow: { flexDirection: 'row', alignItems: 'center', minHeight: 48 },
    hint: { flex: 1 },
  });

export default function GeofenceEditorPage({ route, navigation }) {
  const { vehicleId, geofenceId } = route.params;
  const isEditing = !!geofenceId;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const zones = useSelector(selectGeofenceZones);
  const links = useSelector(selectVehicleLinks(vehicleId));
  const isSaving = useSelector(selectIsSavingGeofence);
  const geofence = isEditing ? zones.byId[geofenceId] : null;
  const circle = getCircle(geofence);
  const hasLoadedRef = useRef(false);

  const [shape, setShape] = useState('polygon'); // 'polygon' | 'circle'
  const [points, setPoints] = useState([]);
  const [circleCenter, setCircleCenter] = useState(null);
  const [circleRadius, setCircleRadius] = useState(DEFAULT_CIRCLE_RADIUS);
  const [name, setName] = useState('');
  const [color, setColor] = useState(GEOFENCE_COLORS[0]);
  const [zone, setZone] = useState('out');
  const [pageHeight, setPageHeight] = useState(0);
  const [sheetTop, setSheetTop] = useState(0); // the part of the panel that shows (map padding)
  const handleSheetTop = useCallback((height) => setSheetTop(height), []);

  useEffect(() => {
    navigation.setOptions({ title: isEditing ? 'Edit geofence' : 'Add geofence' });
    dispatch(fetchGeofences());
    dispatch(fetchVehicleGeofences({ deviceId: vehicleId }));
  }, [dispatch, isEditing, navigation, vehicleId]);

  // Editing: fill the form once with what the server has (not again, or typing would be overwritten)
  useEffect(() => {
    if (!isEditing || hasLoadedRef.current || !geofence) {
      return;
    }
    hasLoadedRef.current = true;
    setName(geofence.name || '');
    setColor(geofence.polygon_color || GEOFENCE_COLORS[0]);
    const savedCircle = getCircle(geofence);
    if (savedCircle) {
      setShape('circle');
      setCircleCenter({ latitude: savedCircle.latitude, longitude: savedCircle.longitude });
      setCircleRadius(savedCircle.radius);
    } else {
      setPoints(parseCoordinates(geofence.coordinates));
    }
    const link = links.items.find((item) => item.geofence_id === geofenceId);
    if (link) {
      setZone(link.zone);
    }
  }, [isEditing, geofence, links.items, geofenceId]);

  const vehicleSpot = vehicle && Number(vehicle.lat) ? { latitude: Number(vehicle.lat), longitude: Number(vehicle.lng) } : null;
  const startCenter = getCenter(parseCoordinates(geofence && geofence.coordinates)) || circle || vehicleSpot || FALLBACK_REGION;
  const isCircle = shape === 'circle';
  // A polygon gets a new corner; a circle is placed (or moved) where the map is tapped
  const addPoint = (event) => {
    const coordinate = event.nativeEvent.coordinate; // read now: the event is released after this handler
    if (isCircle) {
      setCircleCenter(coordinate);
      return;
    }
    setPoints((current) => [...current, coordinate]);
  };
  const clearDrawing = () => (isCircle ? setCircleCenter(null) : setPoints([]));
  const hasDrawing = isCircle ? !!circleCenter : points.length > 0;

  let hint = `Tap the map to add corners (${points.length}/${MIN_GEOFENCE_POINTS} at least)`;
  if (isCircle) {
    hint = circleCenter ? 'Tap the map to move the circle' : 'Tap the map to place the circle';
  }

  const save = async () => {
    if (isBlank(name)) {
      dispatch(showToast({ type: 'warning', message: 'Enter a name for the geofence' }));
      return;
    }
    if (isCircle && !circleCenter) {
      dispatch(showToast({ type: 'warning', message: 'Tap the map to place the circle' }));
      return;
    }
    if (!isCircle && points.length < MIN_GEOFENCE_POINTS) {
      dispatch(showToast({ type: 'warning', message: `Tap at least ${MIN_GEOFENCE_POINTS} points on the map` }));
      return;
    }
    const result = await dispatch(
      saveVehicleGeofence({
        deviceId: vehicleId,
        geofenceId: geofenceId || null,
        name,
        color,
        points: isCircle ? null : points,
        circle: isCircle ? { ...circleCenter, radius: circleRadius } : null,
        zone,
      }),
    );
    if (saveVehicleGeofence.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'Could not save the geofence' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: isEditing ? 'Geofence updated' : 'Geofence saved' }));
    navigation.goBack();
  };

  return (
    <View style={styles.screen} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        mapPadding={{ top: 0, right: 0, bottom: sheetTop, left: 0 }}
        initialRegion={{
          latitude: startCenter.latitude,
          longitude: startCenter.longitude,
          latitudeDelta: START_DELTA,
          longitudeDelta: START_DELTA,
        }}
        toolbarEnabled={false}
        pitchEnabled={false}
        onPress={addPoint}
      >
        {!!vehicleSpot && <Marker coordinate={vehicleSpot} title={vehicle.device_name} pinColor={colors.primary} />}
        <GeofenceDraft points={points} color={color} shape={shape} circleCenter={circleCenter} circleRadius={circleRadius} />
      </MapView>
      <EditorSheet
        maxHeight={pageHeight > 0 ? Math.round(pageHeight * SHEET_MAX_SHARE) : undefined}
        onVisibleHeight={handleSheetTop}
        bar={
          <View style={styles.bar}>
            <View style={styles.barRow}>
              <AppText variant="caption" style={styles.hint} numberOfLines={2}>
                {hint}
              </AppText>
              {!isCircle && (
                <IconButton icon="undo" size={20} iconColor={colors.primary} disabled={points.length === 0} onPress={() => setPoints((current) => current.slice(0, -1))} accessibilityLabel="Undo last point" />
              )}
              <IconButton icon="delete-outline" size={20} iconColor={colors.primary} disabled={!hasDrawing} onPress={clearDrawing} accessibilityLabel={isCircle ? 'Remove the circle' : 'Clear points'} />
            </View>
            <GeofenceShapeControls
              shape={shape}
              onShapeChange={setShape}
              radiusMeters={circleRadius}
              onRadiusStep={(direction) => setCircleRadius((current) => stepCircleRadius(current, direction))}
            />
          </View>
        }
      >
        <GeofenceForm
          name={name}
          zone={zone}
          color={color}
          isSaving={isSaving}
          isEditing={isEditing}
          onChangeName={setName}
          onChangeZone={setZone}
          onChangeColor={setColor}
          onSave={save}
        />
      </EditorSheet>
    </View>
  );
}
