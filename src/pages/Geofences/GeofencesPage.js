// Geofences of one vehicle: the list with when each one alerts, plus add, edit and delete.
// Opens with `{ id }` (the vehicle). Geofences and the vehicle's links live in Redux.
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { Dialog, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import routeNames from '../../routes/routeNames';
import {
  deleteVehicleGeofence,
  fetchGeofences,
  fetchVehicleGeofences,
  selectGeofenceZones,
  selectIsDeletingGeofence,
  selectVehicleLinks,
} from '../../store/slices/geofencesSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { joinVehicleGeofences } from '../../utils/geofence';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import GeofenceRow from './components/GeofenceRow';
import GeofencesSkeleton from './GeofencesSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { gap: spacing.xs, marginBottom: spacing.md },
    add: { marginTop: spacing.sm },
  });

export default function GeofencesPage({ route, navigation }) {
  const refreshSlot = useRefreshSlotStyle();
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));
  const zones = useSelector(selectGeofenceZones);
  const links = useSelector(selectVehicleLinks(id));
  const isDeleting = useSelector(selectIsDeletingGeofence);
  const [toDelete, setToDelete] = useState(null);

  // Each loads only when missing or stale (see the thunk conditions)
  useEffect(() => {
    dispatch(fetchGeofences());
    dispatch(fetchVehicleGeofences({ deviceId: id }));
  }, [dispatch, id]);

  const rows = useMemo(() => joinVehicleGeofences(links.items, zones.byId), [links.items, zones.byId]);
  const isLoading = links.status === 'loading' || zones.status === 'loading';

  const refresh = useCallback(() => {
    dispatch(fetchGeofences({ force: true }));
    dispatch(fetchVehicleGeofences({ deviceId: id, force: true }));
  }, [dispatch, id]);

  const openEditor = useCallback(
    (geofenceId) => navigation.navigate(routeNames.geofenceEditor, { vehicleId: id, geofenceId }),
    [navigation, id],
  );

  const confirmDelete = async () => {
    const target = toDelete;
    const result = await dispatch(deleteVehicleGeofence({ deviceId: id, geofenceId: target.id }));
    setToDelete(null);
    if (deleteVehicleGeofence.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'Could not delete the geofence' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: 'Geofence deleted' }));
  };

  const renderItem = useCallback(
    ({ item }) => <GeofenceRow item={item} onEdit={openEditor} onDelete={setToDelete} />,
    [openEditor],
  );

  if (isLoading && rows.length === 0 && links.lastFetchedAt === null) {
    return <GeofencesSkeleton />;
  }
  if (links.status === 'failed' && rows.length === 0) {
    return <ErrorState message={links.error} onRetry={refresh} />;
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={rows}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, refreshSlot]}
        refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ListHeaderComponent={
          <View style={styles.header}>
            <AppText variant="subtitle">{vehicle ? vehicle.device_name : 'Geofences'}</AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              You get an alert when this vehicle enters or leaves one of these areas.
            </AppText>
          </View>
        }
        ListEmptyComponent={<EmptyState text="No geofence for this vehicle yet" />}
        ListFooterComponent={
          <AppButton title="Add geofence" icon="plus" style={styles.add} onPress={() => openEditor(null)} />
        }
      />

      <Portal>
        <Dialog visible={!!toDelete} onDismiss={isDeleting ? undefined : () => setToDelete(null)}>
          <Dialog.Title>Delete geofence?</Dialog.Title>
          <Dialog.Content>
            <AppText>
              {`"${toDelete ? toDelete.name : ''}" will be deleted, with its alerts. If other vehicles use it, they lose it too.`}
            </AppText>
          </Dialog.Content>
          <Dialog.Actions>
            <AppButton title="Cancel" variant="link" isDisabled={isDeleting} onPress={() => setToDelete(null)} />
            <AppButton title="Delete" variant="secondary" isLoading={isDeleting} onPress={confirmDelete} />
          </Dialog.Actions>
        </Dialog>
      </Portal>
    </View>
  );
}
