// Location report, laid out like the web report: filters, summary boxes and the point by point table.
// The report lives in Redux (locationReportSlice). Opens with `{ type: 'location', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import {
  fetchLocationReport,
  fetchMoreLocationReport,
  selectLocationReport,
} from '../../store/slices/locationReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { HOUR_RANGES } from '../../utils/hourlyReport';
import { buildLocationCsv } from '../../utils/locationReport';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import HourlySummaryCards from './components/HourlySummaryCards';
import LocationTable from './components/LocationTable';
import ReportSkeleton from './ReportSkeleton';

const WHOLE_DAY = '00:00-23:59';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** The filters of a quick button: its dates, the whole day, every vehicle. */
const startFilters = (preset, vehicleId = 0) => {
  const { fromDate, toDate } = presetFilters(preset);
  return { vehicleId, search: '', fromDate, toDate, timeRange: WHOLE_DAY };
};

export default function LocationReportPage({ route }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectLocationReport);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: all vehicles, today, the whole day
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = startFilters('today', startVehicleId);
    setFilters(first);
    dispatch(fetchLocationReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchLocationReport(next)), [dispatch]);

  const handleChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handlePreset = (name) => {
    if (name === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const { fromDate, toDate } = presetFilters(name);
    const next = { ...filters, fromDate, toDate };
    setFilters(next);
    run(next);
  };

  const handleReset = () => {
    setIsCustom(false);
    const next = startFilters('today');
    setFilters(next);
    run(next);
  };

  const handleApply = () => {
    if (filters.fromDate > filters.toDate) {
      dispatch(showToast({ type: 'warning', message: 'The start date must be before the end date' }));
      return;
    }
    run(filters);
  };

  const handleExport = async () => {
    try {
      await Share.share({ message: buildLocationCsv(data) });
    } catch (shareError) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
  };

  const handleOpenMap = (row) => {
    navigation.navigate(routeNames.pointLocation, {
      latitude: row.latitude,
      longitude: row.longitude,
      title: row.vehicle,
      subtitle: `${row.date} · ${row.start}${row.end !== row.start ? ` – ${row.end}` : ''} · ${row.speed.toFixed(0)} km/h`,
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
    body = (
      <>
        <HourlySummaryCards data={data} avgLabel="Avg. Speed" avgText={`${data.avgSpeed.toFixed(2)} km/h`} />
        {data.rows.length === 0 ? (
          <EmptyState text="No locations found for these filters. Try other dates." />
        ) : (
          <LocationTable
            data={data}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => dispatch(fetchMoreLocationReport())}
            onExport={handleExport}
            onOpenMap={handleOpenMap}
          />
        )}
      </>
    );
  }

  // The quick buttons only look at the dates (the time of day has its own choice)
  const presetKey = isCustom ? 'custom' : activePreset({ ...filters, fromTime: '00:00', toTime: '23:59' });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => run(filters)} />}
      keyboardShouldPersistTaps="handled"
    >
      <DailyFilters
        filters={filters}
        vehicles={vehicles}
        activeKey={presetKey}
        onPreset={handlePreset}
        onChange={handleChange}
        onApply={handleApply}
        onReset={handleReset}
        isLoading={isLoading}
        allowAllVehicles
        onSearch={(text) => handleChange('search', text)}
        timeRangeOptions={HOUR_RANGES}
      />
      {body}
    </ScrollView>
  );
}
