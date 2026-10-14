// Speed report, laid out like the web report: filters, speed boxes, the Speed Trend chart and the table.
// The report lives in Redux (speedReportSlice). Opens with `{ type: 'speed', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useReportExport from '../../hooks/useReportExport';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import { fetchMoreSpeedReport, fetchSpeedReport, selectSpeedReport } from '../../store/slices/speedReportSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { HOUR_RANGES } from '../../utils/hourlyReport';
import { buildSpeedExport, exportSubtitle } from '../../utils/reportExports';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import SpeedChart from './components/SpeedChart';
import SpeedSummaryCards from './components/SpeedSummaryCards';
import SpeedTable from './components/SpeedTable';
import ReportSkeleton from './ReportSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const WHOLE_DAY = '00:00-23:59';

const selectExportData = (state) => selectSpeedReport(state).data;

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

export default function SpeedReportPage({ route }) {
  const refreshSlot = useRefreshSlotStyle();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error, isLoadingMore } = useSelector(selectSpeedReport);
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
    dispatch(fetchSpeedReport(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchSpeedReport(next)), [dispatch]);

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
          message: t('The start date must be before the end date'),
        }),
      );
      return;
    }
    run(filters);
  };

  const { exportFile, busyFormat } = useReportExport({
    select: selectExportData,
    loadMore: fetchMoreSpeedReport,
    build: buildSpeedExport,
    subtitle: exportSubtitle(filters, vehicles),
  });

  const handleOpenMap = (row) => {
    navigation.navigate(routeNames.pointLocation, {
      latitude: row.latitude,
      longitude: row.longitude,
      title: row.vehicle,
      subtitle: `${row.date} · ${row.start} · max ${row.max.toFixed(0)} km/h`,
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
        <SpeedSummaryCards data={data} />
        {data.rows.length === 0 ? (
          <EmptyState text={t('No speed readings found for these filters. Try other dates.')} />
        ) : (
          <>
            <SpeedChart chart={data.chart} bucketLabel={data.bucketLabel} />
            <SpeedTable
              data={data}
              isLoadingMore={isLoadingMore}
              onLoadMore={() => dispatch(fetchMoreSpeedReport())}
              onExport={exportFile}
              busyFormat={busyFormat}
              onOpenMap={handleOpenMap}
            />
          </>
        )}
      </>
    );
  }

  // The quick buttons only look at the dates (the time of day has its own choice)
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
        timeRangeOptions={HOUR_RANGES}
      />
      {body}
    </ScrollView>
  );
}
