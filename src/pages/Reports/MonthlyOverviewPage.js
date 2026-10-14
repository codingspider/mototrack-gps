// Monthly distance overview, laid out like the web report: filters, summary boxes and the vehicles x days table.
// The report lives in Redux (monthlyOverviewSlice). Opens with `{ type: 'monthly', vehicleId? }`.
import React, { useCallback, useEffect, useState } from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useReportExport from '../../hooks/useReportExport';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { fetchMonthlyOverview, selectMonthlyOverview } from '../../store/slices/monthlyOverviewSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { activePreset, presetFilters } from '../../utils/dailyActivity';
import { buildMonthlyExport, exportSubtitle } from '../../utils/reportExports';
import { spacing, useThemedStyles } from '../../theme';
import DailyFilters from './components/DailyFilters';
import MonthlySummaryCards from './components/MonthlySummaryCards';
import MonthlyTable from './components/MonthlyTable';
import ReportSkeleton from './ReportSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const selectExportData = (state) => selectMonthlyOverview(state).data;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm },
  });

export default function MonthlyOverviewPage({ route }) {
  const refreshSlot = useRefreshSlotStyle();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const startVehicleId = route.params && route.params.vehicleId ? route.params.vehicleId : 0;
  const vehicles = useSelector(selectAllVehicles);
  const { data, status, error } = useSelector(selectMonthlyOverview);
  const [filters, setFilters] = useState(null);
  const [isCustom, setIsCustom] = useState(false); // the Custom button was tapped: show it as the active one
  const isLoading = status === 'loading';

  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  // Like the web page: all vehicles, today only (it opens fast), shown at once
  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const first = {
      vehicleId: startVehicleId,
      search: '',
      ...presetFilters('today'),
    };
    setFilters(first);
    dispatch(fetchMonthlyOverview(first));
  }, [filters, vehicles, startVehicleId, dispatch]);

  const run = useCallback((next) => dispatch(fetchMonthlyOverview(next)), [dispatch]);

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
    const next = { vehicleId: 0, search: '', ...presetFilters('today') };
    setFilters(next);
    run(next);
  };

  const handleApply = () => {
    const isBackwards = `${filters.fromDate} ${filters.fromTime}` > `${filters.toDate} ${filters.toTime}`;
    if (isBackwards) {
      dispatch(
        showToast({
          type: 'warning',
          message: t('The start must be before the end'),
        }),
      );
      return;
    }
    run(filters);
  };

  const { exportFile, busyFormat } = useReportExport({
    select: selectExportData,
    build: buildMonthlyExport,
    subtitle: exportSubtitle(filters, vehicles),
  });

  if (!filters || (isLoading && !data)) {
    return <ReportSkeleton />;
  }

  let body = null;
  if (status === 'failed' && !data) {
    body = <ErrorState message={error} onRetry={() => run(filters)} />;
  } else if (data) {
    body = (
      <>
        <MonthlySummaryCards data={data} />
        {data.rows.length === 0 ? (
          <EmptyState text={t('No vehicles found for these filters.')} />
        ) : (
          <MonthlyTable data={data} onExport={exportFile} busyFormat={busyFormat} />
        )}
      </>
    );
  }

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
        activeKey={isCustom ? 'custom' : activePreset(filters)}
        onPreset={handlePreset}
        onChange={handleChange}
        onApply={handleApply}
        onReset={handleReset}
        isLoading={isLoading}
        allowAllVehicles
        onSearch={(text) => handleChange('search', text)}
      />
      {body}
    </ScrollView>
  );
}
