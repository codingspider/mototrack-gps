// Movement summary report, laid out like the web report: filters, summary boxes and the day by day table.
// The report lives in Redux (movementReportSlice). Opens with `{ type: 'movement', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useReportExport from '../../hooks/useReportExport';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { fetchMoreMovementReport, fetchMovementReport, selectMovementReport } from '../../store/slices/movementReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { buildMovementExport, exportSubtitle } from '../../utils/reportExports';
import { spacing, useThemedStyles } from '../../theme';
import ActivitySummaryCards from './components/ActivitySummaryCards';
import DailyFilters from './components/DailyFilters';
import MovementTable from './components/MovementTable';
import ReportSkeleton from './ReportSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const selectExportData = (state) => selectMovementReport(state).data;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

/** The filters of a quick button: its dates and every vehicle (like the web page). */
const startFilters = (preset, vehicleId = 0) => {
  const { fromDate, toDate } = presetFilters(preset);
  return { vehicleId, search: '', fromDate, toDate };
};

export default function MovementReportPage({ route }) {
  const refreshSlot = useRefreshSlotStyle();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectMovementReport);
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
    dispatch(fetchMovementReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchMovementReport(next)), [dispatch]);

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
    loadMore: fetchMoreMovementReport,
    build: buildMovementExport,
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
        <ActivitySummaryCards
          data={data}
          vehicleName={chosen ? chosen.device_name : ''}
          timeLabel={t('Total Operating Time')}
          timeValue={data.operatingTime}
        />
        {data.rows.length === 0 ? (
          <EmptyState text={t('No movement found for these filters.')} />
        ) : (
          <MovementTable
            data={data}
            isLoadingMore={isLoadingMore}
            onLoadMore={() => dispatch(fetchMoreMovementReport())}
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
        dateLabels={['From date', 'To date']}
      />
      {body}
    </ScrollView>
  );
}
