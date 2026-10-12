// Trip report, laid out like the web report: filters, summary boxes and the table of trips of one vehicle.
// The report lives in Redux (tripReportSlice). Opens with `{ type: 'trip', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { fetchMoreTripReport, fetchTripReport, selectTripReport } from '../../store/slices/tripReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { buildTripCsv } from '../../utils/tripReport';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import TripSummaryCards from './components/TripSummaryCards';
import TripTable from './components/TripTable';
import ReportSkeleton from './ReportSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** The filters of a quick button: its dates and the whole day, for one vehicle. */
const startFilters = (preset, vehicleId) => ({ vehicleId, search: '', ...presetFilters(preset) });

export default function TripReportPage({ route }) {
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectTripReport);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: the first vehicle (or the one the page was opened for), today, shown at once
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const vehicleId = startVehicleId || vehicles[0].id;
    const first = startFilters('today', vehicleId);
    setFilters(first);
    dispatch(fetchTripReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchTripReport(next)), [dispatch]);

  const handleChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handlePreset = (name) => {
    if (name === 'custom') {
      setIsCustom(true);
      return;
    }
    setIsCustom(false);
    const next = { ...filters, ...presetFilters(name) };
    setFilters(next);
    run(next);
  };

  const handleReset = () => {
    setIsCustom(false);
    const next = startFilters('today', startVehicleId || vehicles[0].id);
    setFilters(next);
    run(next);
  };

  const handleApply = () => {
    if (`${filters.fromDate} ${filters.fromTime}` > `${filters.toDate} ${filters.toTime}`) {
      dispatch(showToast({ type: 'warning', message: 'The start must be before the end' }));
      return;
    }
    run(filters);
  };

  const handleExport = async () => {
    try {
      await Share.share({ message: buildTripCsv(data) });
    } catch (shareError) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
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
        <TripSummaryCards data={data} />
        {data.rows.length === 0 ? (
          <EmptyState text="No trips found for these filters. Try other dates." />
        ) : (
          <TripTable
            data={data}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => dispatch(fetchMoreTripReport())}
            onExport={handleExport}
          />
        )}
      </>
    );
  }

  const presetKey = isCustom ? 'custom' : activePreset(filters);

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
        onSearch={(text) => handleChange('search', text)}
      />
      {body}
    </ScrollView>
  );
}
