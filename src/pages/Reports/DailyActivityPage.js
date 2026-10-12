// Daily activity report (distance per day), laid out like the web report: filters, summary boxes and the table.
// The report lives in Redux (dailyActivitySlice). Opens with `{ type: 'daily', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { fetchDailyActivity, selectDailyActivity } from '../../store/slices/dailyActivitySlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, buildDailyCsv, presetFilters } from '../../utils/dailyActivity';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import DailySummaryCards from './components/DailySummaryCards';
import DailyTable from './components/DailyTable';
import ReportSkeleton from './ReportSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

export default function DailyActivityPage({ route }) {
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params ? route.params.vehicleId : undefined;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error } = useSelector(selectDailyActivity);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Start with the last 7 days of the first vehicle (or the one the page was opened for) and show it at once
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = { vehicleId: startVehicleId || vehicles[0].id, ...presetFilters('week') };
    setFilters(first);
    dispatch(fetchDailyActivity(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchDailyActivity(next)), [dispatch]);

  const handleChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handlePreset = (name) => {
    if (name === 'custom') {
      // Custom only means "I choose the dates": keep what is there and let the person change it
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
    const next = { vehicleId: startVehicleId || vehicles[0].id, ...presetFilters('week') };
    setFilters(next);
    run(next);
  };

  const handleApply = () => {
    const isBackwards = `${filters.fromDate} ${filters.fromTime}` > `${filters.toDate} ${filters.toTime}`;
    if (isBackwards) {
      dispatch(showToast({ type: 'warning', message: 'The start must be before the end' }));
      return;
    }
    run(filters);
  };

  const handleExport = async () => {
    try {
      await Share.share({ message: buildDailyCsv(data.vehicleName, data.rows) });
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
        <DailySummaryCards data={data} />
        {data.rows.length === 0 ? (
          <EmptyState text="No movement found for these filters. Try other dates." />
        ) : (
          <DailyTable data={data} onExport={handleExport} />
        )}
      </>
    );
  }

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
        activeKey={isCustom ? 'custom' : activePreset(filters)}
        onPreset={handlePreset}
        onChange={handleChange}
        onApply={handleApply}
        onReset={handleReset}
        isLoading={isLoading}
      />
      {body}
    </ScrollView>
  );
}
