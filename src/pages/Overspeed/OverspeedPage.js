// Overspeed limit of one vehicle: choose the limit, save it, and see the recent overspeed alerts.
// The limit lives on the server (overspeedSlice), the alerts come from the Overspeed report (reportsSlice).
import React, { useEffect, useState } from 'react';
import { Linking, ScrollView, StyleSheet, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import ErrorState from '../../components/common/ErrorState';
import { fetchReport, selectReport } from '../../store/slices/reportsSlice';
import { fetchOverspeedLimit, saveOverspeedLimit, selectOverspeed } from '../../store/slices/overspeedSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { getPresetRange } from '../../utils/playbackRange';
import ReportRow from '../Reports/components/ReportRow';
import ReportSkeleton from '../Reports/ReportSkeleton';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import LimitCard from './components/LimitCard';

const DEFAULT_LIMIT_KMH = 80;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.sm, paddingBottom: spacing.xxl },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: spacing.sm },
  });

export default function OverspeedPage({ route, navigation }) {
  const refreshSlot = useRefreshSlotStyle();
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));
  const { limit: savedLimit, status, isSaving, error } = useSelector(selectOverspeed(id));
  const alerts = useSelector(selectReport('overspeed'));
  const [chosen, setChosen] = useState(DEFAULT_LIMIT_KMH);

  const loadAlerts = (limit) => {
    const today = getPresetRange('today').fromDate;
    const weekAgo = getPresetRange('week').fromDate;
    dispatch(fetchReport({ type: 'overspeed', filters: { vehicleId: id, from: `${weekAgo} 00:00`, to: `${today} 23:59`, limit }, page: 1 }));
  };

  useEffect(() => {
    navigation.setOptions({ title: 'Overspeed limit' });
    dispatch(fetchOverspeedLimit({ deviceId: id }));
  }, [dispatch, id, navigation]);

  // When the server's limit is known, start the stepper there and list the alerts above that limit
  useEffect(() => {
    if (status === 'succeeded') {
      const limit = savedLimit || DEFAULT_LIMIT_KMH;
      setChosen(limit);
      loadAlerts(limit);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, savedLimit]);

  const save = async (limit) => {
    const result = await dispatch(saveOverspeedLimit({ deviceId: id, limit }));
    if (saveOverspeedLimit.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload ? result.payload.message : 'Could not save the limit' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: limit === null ? 'Limit removed' : `Limit saved: ${limit} km/h` }));
  };

  if (status === 'failed' && savedLimit === null) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchOverspeedLimit({ deviceId: id }))} />;
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, refreshSlot]}
      refreshControl={<AppRefreshControl refreshing={false} onRefresh={() => dispatch(fetchOverspeedLimit({ deviceId: id }))} />}
    >
      {!!vehicle && (
        <AppText variant="caption" color={colors.textSecondary}>
          {vehicle.device_name}
        </AppText>
      )}
      <LimitCard
        value={chosen}
        onChange={setChosen}
        savedLimit={savedLimit}
        isSaving={isSaving}
        onSave={() => save(chosen)}
        onRemove={() => save(null)}
      />
      <View style={styles.titleRow}>
        <AppText variant="subtitle">Overspeed alerts</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Last 7 days · {alerts.pagination.total}
        </AppText>
      </View>
      {alerts.status === 'loading' && alerts.rows.length === 0 && <ReportSkeleton />}
      {alerts.status !== 'loading' && alerts.rows.length === 0 && (
        <AppText color={colors.textSecondary}>No overspeed alerts above {chosen} km/h in the last 7 days.</AppText>
      )}
      {alerts.rows.map((row) => (
        <ReportRow key={row.key} row={row} onPress={() => Linking.openURL(row.action.url)} />
      ))}
    </ScrollView>
  );
}
