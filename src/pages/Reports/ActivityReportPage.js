// Vehicle activity report, laid out like the web report: filters, summary boxes and the table of vehicles with their
// trips for the period. The report lives in Redux (activityReportSlice). Opens with `{ type: 'activity', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useReportExport from '../../hooks/useReportExport';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { fetchActivityReport, fetchMoreActivityReport, selectActivityReport } from '../../store/slices/activityReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { buildActivityExport, exportSubtitle } from '../../utils/reportExports';
import { spacing, useThemedStyles } from '../../theme';
import ActivitySummaryCards from './components/ActivitySummaryCards';
import ActivityTable from './components/ActivityTable';
import DailyFilters from './components/DailyFilters';
import ReportSkeleton from './ReportSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const selectExportData = (state) => selectActivityReport(state).data;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** The filters of a quick button: its dates, every vehicle, no minimum distance (like the web page). */
const startFilters = (preset, vehicleId = 0) => {
  const { fromDate, toDate } = presetFilters(preset);
  return { vehicleId, search: '', fromDate, toDate, minDistance: '0' };
};

export default function ActivityReportPage({ route }) {
  const refreshSlot = useRefreshSlotStyle();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectActivityReport);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: all vehicles, today, shown at once
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = startFilters('today', startVehicleId);
    setFilters(first);
    dispatch(fetchActivityReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchActivityReport(next)), [dispatch]);

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
      dispatch(
        showToast({
          type: 'warning',
          message: t('The from date must be before the to date'),
        }),
      );
      return;
    }
    run(filters);
  };

  const { exportFile, busyFormat } = useReportExport({
    select: selectExportData,
    loadMore: fetchMoreActivityReport,
    build: buildActivityExport,
    subtitle: exportSubtitle(filters, vehicles),
  });

  if (!filters || (isLoading && !data)) {
    return <ReportSkeleton />;
  }

  // The name of the chosen vehicle, for "Selected: ..." under Total Vehicles
  const chosen = vehicles.find((vehicle) => vehicle.id === filters.vehicleId);

  let body = null;
  if (status === 'failed' && !data) {
    body = <ErrorState message={error} onRetry={() => run(filters)} />;
  } else if (data) {
    body = (
      <>
        <ActivitySummaryCards data={data} vehicleName={chosen ? chosen.device_name : ''} />
        {data.rows.length === 0 ? (
          <EmptyState text={t('No vehicles found for these filters.')} />
        ) : (
          <ActivityTable
            data={data}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => dispatch(fetchMoreActivityReport())}
            onExport={exportFile}
            busyFormat={busyFormat}
          />
        )}
      </>
    );
  }

  // The quick buttons only look at the dates
  const presetKey = isCustom ? 'custom' : activePreset({ ...filters, fromTime: '00:00', toTime: '23:59' });

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[[styles.content, { paddingBottom: tabBarSpace }], refreshSlot]}
      refreshControl={<AppRefreshControl refreshing={false} onRefresh={() => run(filters)} />}
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
        showTimes={false}
        hasMinDistance
        dateLabels={['From date', 'To date']}
      />
      {body}
    </ScrollView>
  );
}
