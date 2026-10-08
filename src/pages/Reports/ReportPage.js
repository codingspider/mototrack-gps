// One report: filters at the top, then summary cards and rows. The report type picks its filters and its rows
// (see utils/reportConfigs). Results live in Redux (reportsSlice).
import React, { useEffect, useState } from 'react';
import { Linking, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import routeNames from '../../routes/routeNames';
import { fetchReport, selectReport } from '../../store/slices/reportsSlice';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { getPresetRange } from '../../utils/playbackRange';
import { buildDefaultFilters, getReportConfig } from '../../utils/reportConfigs';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import FilterCard from './components/FilterCard';
import ReportRow from './components/ReportRow';
import SummaryCards from './components/SummaryCards';
import ReportSkeleton from './ReportSkeleton';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
    footer: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  });

export default function ReportPage({ route, navigation }) {
  const { type, vehicleId: startVehicleId } = route.params;
  const config = getReportConfig(type);
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicles = useSelector(selectAllVehicles);
  const report = useSelector(selectReport(type));
  const [filters, setFilters] = useState(null);
  const isLoading = report.status === 'loading';
  const hasRows = report.rows.length > 0;

  const runReport = (page = 1) => dispatch(fetchReport({ type, filters, page }));

  // The filters start from today / this week and the first vehicle, so wait until the vehicles are known
  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  useEffect(() => {
    if (filters || vehicles.length === 0) {
      return;
    }
    const today = getPresetRange('today').fromDate;
    const weekAgo = getPresetRange('week').fromDate;
    const first = buildDefaultFilters(config, startVehicleId || vehicles[0].id, today, weekAgo);
    setFilters(first);
    dispatch(fetchReport({ type, filters: first, page: 1 })); // show something straight away
  }, [filters, vehicles, config, startVehicleId, type, dispatch]);

  const handleChange = (key, value) => setFilters((current) => ({ ...current, [key]: value }));

  const handleRowPress = (row) => {
    const { action } = row;
    if (action.type === 'url') {
      Linking.openURL(action.url);
    } else if (action.type === 'playback') {
      navigation.navigate(routeNames.playback, { id: action.vehicleId, range: action.range });
    }
  };

  if (!filters) {
    return <ReportSkeleton />;
  }

  let body = null;
  if (isLoading && !hasRows) {
    body = <ReportSkeleton />;
  } else if (report.status === 'failed' && !hasRows) {
    body = <ErrorState message={report.error} onRetry={() => runReport(1)} />;
  } else {
    body = (
      <>
        <SummaryCards items={report.summary} />
        {!!report.note && (
          <AppText variant="caption" color={colors.textSecondary}>
            {report.note}
          </AppText>
        )}
        {!hasRows && !report.note && <EmptyState text="Nothing found for these filters. Try other dates." />}
        {report.rows.map((row) => (
          <ReportRow key={row.key} row={row} onPress={() => handleRowPress(row)} />
        ))}
        {hasRows && report.pagination.lastPage > 1 && (
          <View style={styles.footer}>
            <AppText variant="caption" color={colors.textSecondary}>
              Page {report.pagination.page} of {report.pagination.lastPage} · {config.pageSize} per page
            </AppText>
            {report.pagination.page < report.pagination.lastPage && (
              <AppButton
                title="Load more"
                variant="link"
                isCompact
                isLoading={isLoading}
                onPress={() => runReport(report.pagination.page + 1)}
              />
            )}
          </View>
        )}
      </>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      refreshControl={<RefreshControl refreshing={false} onRefresh={() => runReport(1)} />}
    >
      <AppText variant="caption" color={colors.textSecondary}>
        {config.subtitle}
      </AppText>
      <FilterCard fields={config.fields} filters={filters} vehicles={vehicles} onChange={handleChange} onRun={() => runReport(1)} isLoading={isLoading && !hasRows} />
      {body}
    </ScrollView>
  );
}
