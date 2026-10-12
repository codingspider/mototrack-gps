// Last location report, laid out like the web report: quick ranges, filters and the table of vehicles with their
// latest position. The report lives in Redux (lastLocationSlice). Opens with `{ type: 'lastlocation', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import {
  fetchLastLocation,
  fetchMoreLastLocation,
  selectLastLocation,
} from '../../store/slices/lastLocationSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { buildLastLocationCsv, rangeDates } from '../../utils/lastLocationReport';
import { spacing, useThemedStyles } from '../../theme';
import LastLocationFilters from './components/LastLocationFilters';
import LastLocationTable from './components/LastLocationTable';
import ReportSkeleton from './ReportSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** Every vehicle, whatever its last location time (the web default). */
const startFilters = (vehicleId = 0) => ({ range: 'all', ...rangeDates('today'), vehicleId, search: '' });

export default function LastLocationReportPage({ route }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectLastLocation);
  const [filters, setFilters] = useState(null);
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: all vehicles, any last location time, shown at once
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = startFilters(startVehicleId);
    setFilters(first);
    dispatch(fetchLastLocation(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchLastLocation(next)), [dispatch]);

  const handleChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  // A quick button runs the report at once; Custom only opens the two dates
  const handleRange = (range) => {
    if (range === 'custom') {
      setFilters((current) => ({ ...current, range }));
      return;
    }
    const next = { ...filters, range, ...(range === 'all' ? {} : rangeDates(range)) };
    setFilters(next);
    run(next);
  };

  const handleReset = () => {
    const next = startFilters();
    setFilters(next);
    run(next);
  };

  const handleApply = () => {
    if (filters.range === 'custom' && filters.fromDate > filters.toDate) {
      dispatch(showToast({ type: 'warning', message: 'The from date must be before the to date' }));
      return;
    }
    run(filters);
  };

  const handleExport = async () => {
    try {
      await Share.share({ message: buildLastLocationCsv(data) });
    } catch (shareError) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
  };

  const handleOpenMap = (row) => {
    navigation.navigate(routeNames.pointLocation, {
      latitude: row.latitude,
      longitude: row.longitude,
      title: row.vehicle,
      subtitle: `${row.status} · ${row.lastTime}`,
      address: row.nearby,
    });
  };

  if (!filters || (isLoading && !data)) {
    return <ReportSkeleton />;
  }

  let body = null;
  if (status === 'failed' && !data) {
    body = <ErrorState message={error} onRetry={() => run(filters)} />;
  } else if (data) {
    body =
      data.rows.length === 0 ? (
        <EmptyState text="No vehicles found for these filters." />
      ) : (
        <LastLocationTable
          data={data}
          isLoadingMore={isLoadingMore}
          onLoadMore={() => dispatch(fetchMoreLastLocation())}
          onExport={handleExport}
          onOpenMap={handleOpenMap}
        />
      );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => run(filters)} />}
      keyboardShouldPersistTaps="handled"
    >
      <LastLocationFilters
        filters={filters}
        vehicles={vehicles}
        onRange={handleRange}
        onChange={handleChange}
        onApply={handleApply}
        onReset={handleReset}
        isLoading={isLoading}
      />
      {body}
    </ScrollView>
  );
}
