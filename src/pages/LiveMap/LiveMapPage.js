// Live map: every vehicle of the customer at its current position. Positions come from Redux, so the socket
// keeps them moving. Tap a vehicle to open its details.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import MapView, { PROVIDER_GOOGLE } from 'react-native-maps';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useDispatch, useSelector } from 'react-redux';
import { TAB_BAR_HEIGHT } from '../../components/common/AppTabBar';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FilterChips from '../../components/common/FilterChips';
import Skeleton from '../../components/skeleton/Skeleton';
import MapControlButton from '../../components/map/MapControlButton';
import darkMapStyle from '../../components/map/darkMapStyle';
import routeNames from '../../routes/routeNames';
import { selectSocketStatus } from '../../store/slices/appSlice';
import {
  fetchVehicles,
  selectAllVehicles,
  selectVehiclesError,
  selectVehiclesStatus,
} from '../../store/slices/vehiclesSlice';
import { STATUS_FILTERS, countByFilter, filterVehicles, getVehicleCoordinate } from '../../utils/vehicleFilter';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import LiveIndicator from './components/LiveIndicator';
import LiveVehicleMarker from './components/LiveVehicleMarker';

const EDGE_PADDING = { top: 120, right: 60, bottom: 60, left: 60 };
const BANGLADESH_REGION = { latitude: 23.8, longitude: 90.4, latitudeDelta: 4, longitudeDelta: 4 };

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    chips: { position: 'absolute', top: spacing.sm, left: 0, right: 0 },
    fit: { position: 'absolute', right: spacing.md },
    live: { position: 'absolute', left: spacing.md },
    empty: { position: 'absolute', top: 140, left: 0, right: 0 },
  });

export default function LiveMapPage() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { isDark } = useAppTheme();
  const insets = useSafeAreaInsets();
  // The tab bar floats over the map, so the buttons sit above it
  const aboveTabBar = TAB_BAR_HEIGHT + insets.bottom + spacing.sm + spacing.md;
  const styles = useThemedStyles(makeStyles);
  const vehicles = useSelector(selectAllVehicles);
  const status = useSelector(selectVehiclesStatus);
  const error = useSelector(selectVehiclesError);
  const socketStatus = useSelector(selectSocketStatus);
  const mapRef = useRef(null);
  const [isMapReady, setIsMapReady] = useState(false);
  const [filterKey, setFilterKey] = useState('all');

  // Opening the tab loads the list only when it is missing or stale (see the thunk condition)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchVehicles());
    }, [dispatch]),
  );

  const counts = useMemo(() => countByFilter(vehicles), [vehicles]);
  const located = useMemo(
    () =>
      filterVehicles(vehicles, filterKey)
        .map((vehicle) => ({ vehicle, coordinate: getVehicleCoordinate(vehicle) }))
        .filter((item) => item.coordinate),
    [vehicles, filterKey],
  );

  // Show every vehicle once the map and the data are ready, and again when the filter changes.
  // (Not on every live position, so the customer's own zoom is kept.)
  const fitKey = `${filterKey}:${located.length > 0}`;
  useEffect(() => {
    if (!isMapReady || located.length === 0) {
      return;
    }
    mapRef.current?.fitToCoordinates(
      located.map((item) => item.coordinate),
      { edgePadding: EDGE_PADDING, animated: true },
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isMapReady, fitKey]);

  const fitAll = () => {
    if (located.length === 0) {
      return;
    }
    mapRef.current?.fitToCoordinates(
      located.map((item) => item.coordinate),
      { edgePadding: EDGE_PADDING, animated: true },
    );
  };

  const openDetails = useCallback((id) => navigation.navigate(routeNames.vehicleDetails, { id }), [navigation]);
  const refresh = () => dispatch(fetchVehicles({ force: true }));

  if (status === 'loading' && vehicles.length === 0) {
    return <Skeleton height={900} />;
  }
  if (error && vehicles.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <View style={styles.screen}>
      <MapView
        ref={mapRef}
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={BANGLADESH_REGION}
        // Keeps the Google logo and its legal text above the floating tab bar
        mapPadding={{ top: 0, left: 0, right: 0, bottom: TAB_BAR_HEIGHT + insets.bottom + spacing.sm }}
        customMapStyle={isDark ? darkMapStyle : undefined}
        showsMyLocationButton={false}
        toolbarEnabled={false}
        pitchEnabled={false}
        onMapReady={() => setIsMapReady(true)}
      >
        {located.map((item) => (
          <LiveVehicleMarker
            key={item.vehicle.id}
            vehicle={item.vehicle}
            coordinate={item.coordinate}
            onPress={openDetails}
          />
        ))}
      </MapView>

      <View style={styles.chips} pointerEvents="box-none">
        <FilterChips filters={STATUS_FILTERS} selectedKey={filterKey} counts={counts} onSelect={setFilterKey} />
      </View>
      <View style={[styles.live, { bottom: aboveTabBar + spacing.xl }]} pointerEvents="none">
        <LiveIndicator status={socketStatus} />
      </View>
      <View style={[styles.fit, { bottom: aboveTabBar }]}>
        <MapControlButton icon="fit-to-screen-outline" label="Show all vehicles" onPress={fitAll} />
      </View>
      {located.length === 0 && (
        <View style={styles.empty} pointerEvents="none">
          <EmptyState text={vehicles.length === 0 ? 'No vehicles yet' : 'No vehicles to show for this filter'} />
        </View>
      )}
    </View>
  );
}
