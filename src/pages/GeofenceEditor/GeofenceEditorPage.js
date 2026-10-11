// Add or edit a geofence of one vehicle: tap the map to draw the area, name it, choose when to alert, save.
// Opens with `{ vehicleId, geofenceId? }`. A circle drawn on the web can be renamed, recolored and given a new
// alert, but not reshaped here.
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import MapView, { Circle, Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import GeofenceDraft from '../../components/map/GeofenceDraft';
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
import { MIN_GEOFENCE_POINTS, getCenter, getCircle, parseCoordinates } from '../../utils/geofence';
import { isBlank } from '../../utils/validators';
import { GEOFENCE_COLORS, spacing, useAppTheme, useThemedStyles } from '../../theme';
import GeofenceForm from './components/GeofenceForm';

const START_DELTA = 0.01;
const FALLBACK_REGION = { latitude: 23.8, longitude: 90.4 };

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    map: { flex: 3, minHeight: 240 },
    form: { flex: 2 },
    bar: { flexDirection: 'row', alignItems: 'center', paddingLeft: spacing.md, backgroundColor: colors.surface },
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

  const [points, setPoints] = useState([]);
  const [name, setName] = useState('');
  const [color, setColor] = useState(GEOFENCE_COLORS[0]);
  const [zone, setZone] = useState('out');

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
    setPoints(parseCoordinates(geofence.coordinates));
    const link = links.items.find((item) => item.geofence_id === geofenceId);
    if (link) {
      setZone(link.zone);
    }
  }, [isEditing, geofence, links.items, geofenceId]);

  const vehicleSpot = vehicle && Number(vehicle.lat) ? { latitude: Number(vehicle.lat), longitude: Number(vehicle.lng) } : null;
  const startCenter = getCenter(parseCoordinates(geofence && geofence.coordinates)) || circle || vehicleSpot || FALLBACK_REGION;
  const addPoint = (event) => {
    const coordinate = event.nativeEvent.coordinate; // read now: the event is released after this handler
    setPoints((current) => [...current, coordinate]);
  };

  const save = async () => {
    if (isBlank(name)) {
      dispatch(showToast({ type: 'warning', message: 'Enter a name for the geofence' }));
      return;
    }
    if (!circle && points.length < MIN_GEOFENCE_POINTS) {
      dispatch(showToast({ type: 'warning', message: `Tap at least ${MIN_GEOFENCE_POINTS} points on the map` }));
      return;
    }
    const result = await dispatch(
      saveVehicleGeofence({ deviceId: vehicleId, geofenceId: geofenceId || null, name, color, points: circle ? null : points, zone }),
    );
    if (saveVehicleGeofence.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'Could not save the geofence' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: isEditing ? 'Geofence updated' : 'Geofence saved' }));
    navigation.goBack();
  };

  return (
    <View style={styles.screen}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={styles.map}
        initialRegion={{
          latitude: startCenter.latitude,
          longitude: startCenter.longitude,
          latitudeDelta: START_DELTA,
          longitudeDelta: START_DELTA,
        }}
        toolbarEnabled={false}
        pitchEnabled={false}
        onPress={circle ? undefined : addPoint}
      >
        {!!vehicleSpot && <Marker coordinate={vehicleSpot} title={vehicle.device_name} pinColor={colors.primary} />}
        {!!circle && (
          <Circle
            center={circle}
            radius={circle.radius}
            strokeColor={color}
            fillColor={`${color}33`}
            strokeWidth={3}
          />
        )}
        {!circle && <GeofenceDraft points={points} color={color} />}
      </MapView>
      <View style={styles.bar}>
        <AppText variant="caption" style={styles.hint} numberOfLines={2}>
          {circle
            ? 'This is a circle. You can change its name, color and alert here.'
            : `Tap the map to add corners (${points.length}/${MIN_GEOFENCE_POINTS} at least)`}
        </AppText>
        {!circle && (
          <>
            <IconButton icon="undo" size={20} iconColor={colors.primary} disabled={points.length === 0} onPress={() => setPoints((current) => current.slice(0, -1))} accessibilityLabel="Undo last point" />
            <IconButton icon="delete-outline" size={20} iconColor={colors.primary} disabled={points.length === 0} onPress={() => setPoints([])} accessibilityLabel="Clear points" />
          </>
        )}
      </View>
      <View style={styles.form}>
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
      </View>
    </View>
  );
}
