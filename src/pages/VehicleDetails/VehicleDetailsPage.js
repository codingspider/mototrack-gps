// Details of one vehicle. Top half: the live map. Bottom half: summary card and actions, with a drawer that
// slides up over the bottom half for the full details. Everything comes from Redux and updates live.
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
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
import DetailsDrawer from './components/DetailsDrawer';
import MoreDetailsButton from './components/MoreDetailsButton';
import VehicleInfoCard from './components/VehicleInfoCard';

const MAP_SHARE = 0.5; // the map takes the top half of the visible page; the cards share the bottom half

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    // Tight spacing, so the info card and the action grid fit in the bottom half
    bottom: { flex: 1 },
    bottomContent: { padding: spacing.sm, gap: spacing.sm },
  });

export default function VehicleDetailsPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const { height: screenHeight } = useWindowDimensions();
  // Height of the visible page (below the header), so half of it is exactly half of what the user sees
  const [pageHeight, setPageHeight] = useState(screenHeight);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
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

  const mapHeight = Math.round(pageHeight * MAP_SHARE);
  const bottomHeight = pageHeight - mapHeight;
  const isLoadingDetails = vehicle.detailsStatus === 'loading' && !vehicle.details;
  const hasDetailsError = vehicle.detailsStatus === 'failed' && !vehicle.details;

  return (
    <View style={styles.screen} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
      <VehicleMap vehicleId={id} height={mapHeight} />
      <ScrollView style={styles.bottom} contentContainerStyle={styles.bottomContent}>
        <VehicleInfoCard vehicleId={id} />
        <ActionGrid vehicleId={id} />
        <MoreDetailsButton onPress={() => setIsDrawerOpen(true)} />
      </ScrollView>
      <DetailsDrawer
        visible={isDrawerOpen}
        onClose={() => setIsDrawerOpen(false)}
        height={bottomHeight}
        sections={sections}
        isLoading={isLoadingDetails}
        error={hasDetailsError ? vehicle.detailsError : null}
        isRefreshing={vehicle.detailsStatus === 'loading'}
        onRefresh={refresh}
      />
    </View>
  );
}
