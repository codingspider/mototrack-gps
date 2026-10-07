// Details of one vehicle: live map that moves smoothly, status and every piece of data we have for it.
// Everything comes from Redux, so it updates live from the socket like the rest of the app.
import React, { useEffect, useMemo } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import VehicleMap from '../../components/map/VehicleMap';
import {
  fetchVehicleDetails,
  fetchVehicles,
  fetchVehicleWarranty,
  selectVehicleById,
} from '../../store/slices/vehiclesSlice';
import { buildVehicleSections } from '../../utils/vehicleSections';
import { spacing, useThemedStyles } from '../../theme';
import ActionGrid from './components/ActionGrid';
import DetailSection from './components/DetailSection';
import ServiceExpiryCard from './components/ServiceExpiryCard';
import VehicleSummary from './components/VehicleSummary';
import WarrantyCard from './components/WarrantyCard';
import VehicleDetailsSkeleton from './VehicleDetailsSkeleton';

const MAP_HEIGHT = 280;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md },
  });

export default function VehicleDetailsPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));

  // Loads only if missing or stale (see condition in the thunk)
  useEffect(() => {
    dispatch(fetchVehicleDetails({ id }));
    dispatch(fetchVehicleWarranty({ id }));
  }, [dispatch, id]);

  useEffect(() => {
    if (vehicle?.device_name) {
      navigation.setOptions({ title: vehicle.device_name });
    }
  }, [navigation, vehicle?.device_name]);

  const refresh = () => {
    dispatch(fetchVehicleWarranty({ id, force: true }));
    dispatch(fetchVehicleDetails({ id, force: true }));
    dispatch(fetchVehicles({ force: true }));
  };

  const sections = useMemo(() => (vehicle ? buildVehicleSections(vehicle) : []), [vehicle]);

  if (!vehicle) {
    return <EmptyState text="Vehicle not found" />;
  }

  const isLoadingDetails = vehicle.detailsStatus === 'loading' && !vehicle.details;
  const hasDetailsError = vehicle.detailsStatus === 'failed' && !vehicle.details;

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={vehicle.detailsStatus === 'loading'} onRefresh={refresh} />}
    >
      <VehicleMap vehicleId={id} height={MAP_HEIGHT} />
      <VehicleSummary vehicleId={id} />
      <ServiceExpiryCard vehicleId={id} />
      <WarrantyCard vehicleId={id} />
      <ActionGrid />
      {isLoadingDetails && <VehicleDetailsSkeleton />}
      {hasDetailsError && <ErrorState message={vehicle.detailsError} onRetry={refresh} />}
      {sections.map((section) => (
        <DetailSection key={section.key} title={section.title} icon={section.icon} rows={section.rows} />
      ))}
    </ScrollView>
  );
}
