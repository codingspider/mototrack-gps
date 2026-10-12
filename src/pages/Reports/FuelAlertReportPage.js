// Fuel alert report, laid out like the web report: filters, summary boxes and the fuel alerts table.
// The report lives in Redux (fuelAlertReportSlice). Opens with `{ type: 'fuel', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { RefreshControl, ScrollView, Share, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import {
  fetchFuelAlertReport,
  fetchMoreFuelAlertReport,
  selectFuelAlertReport,
} from '../../store/slices/fuelAlertReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { FUEL_ALERT_TYPES, buildFuelAlertCsv } from '../../utils/fuelAlertReport';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import FuelAlertSummaryCards from './components/FuelAlertSummaryCards';
import FuelAlertTable from './components/FuelAlertTable';
import ReportSkeleton from './ReportSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** The filters of a quick button: its dates, the whole day, every vehicle and every fuel alert. */
const startFilters = (preset, vehicleId = 0) => {
  const { fromDate, toDate, fromTime, toTime } = presetFilters(preset);
  return { vehicleId, search: '', fromDate, toDate, fromTime, toTime, status: '' };
};

export default function FuelAlertReportPage({ route }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectFuelAlertReport);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: all vehicles, today, every fuel alert
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = startFilters('today', startVehicleId);
    setFilters(first);
    dispatch(fetchFuelAlertReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchFuelAlertReport(next)), [dispatch]);

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
    const next = startFilters('today');
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
      await Share.share({ message: buildFuelAlertCsv(data) });
    } catch (shareError) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
  };

  const handleOpenMap = (row) => {
    navigation.navigate(routeNames.pointLocation, {
      latitude: row.latitude,
      longitude: row.longitude,
      title: `${row.alert} · ${row.vehicle}`,
      subtitle: `${row.time}${row.amount === null ? '' : ` · ${row.amount.toFixed(2)} L`}`,
      address: row.address,
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
        <FuelAlertSummaryCards data={data} />
        {data.rows.length === 0 ? (
          <EmptyState text="No fuel alerts found. Fuel alerts need a fuel tank sensor on the vehicle and a Fuel alert set up in Alerts." />
        ) : (
          <FuelAlertTable
            data={data}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => dispatch(fetchMoreFuelAlertReport())}
            onExport={handleExport}
            onOpenMap={handleOpenMap}
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
        allowAllVehicles
        onSearch={(text) => handleChange('search', text)}
        statusOptions={FUEL_ALERT_TYPES}
        statusLabel="Fuel alert type"
      />
      {body}
    </ScrollView>
  );
}
