// All the alerts set on one vehicle (overspeed, geofence, ignition...), with whether each is on and its active period.
// Opens with `{ id }` (the vehicle). They are managed on the web portal; this list is read-only.
import React, { useCallback, useEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Icon, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/skeleton/Skeleton';
import {
  fetchDeviceAlerts,
  fetchMoreDeviceAlerts,
  selectDeviceAlerts,
  toggleDeviceAlert,
} from '../../store/slices/deviceAlertsSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { formatAlertTime } from '../../utils/notifications';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { gap: 2, marginBottom: spacing.md },
    card: { marginBottom: spacing.sm, padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 38, height: 38, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    skeleton: { padding: spacing.md, gap: spacing.sm },
    skeletonBlock: { borderRadius: radius.md },
    footer: { padding: spacing.md },
  });

/** "From 01 Oct, 12:00 AM to 31 Oct, 11:59 PM", or null when the alert has no period. */
function describePeriod(alert) {
  if (!alert.date_from && !alert.date_to) {
    return null;
  }
  const from = alert.date_from ? `From ${formatAlertTime(alert.date_from)}` : '';
  const to = alert.date_to ? `to ${formatAlertTime(alert.date_to)}` : '';
  return [from, to].filter(Boolean).join(' ');
}

export default function DeviceAlertsPage({ route }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));
  const { items, status, error, isLoadingMore, total, savingAlertId } = useSelector(selectDeviceAlerts(id));

  useEffect(() => {
    dispatch(fetchDeviceAlerts({ deviceId: id }));
  }, [dispatch, id]);

  const refresh = useCallback(() => dispatch(fetchDeviceAlerts({ deviceId: id, force: true })), [dispatch, id]);
  const loadMore = useCallback(() => dispatch(fetchMoreDeviceAlerts({ deviceId: id })), [dispatch, id]);

  const handleToggle = async (alert, isActive) => {
    const result = await dispatch(toggleDeviceAlert({ deviceId: id, alertId: alert.id, isActive }));
    if (toggleDeviceAlert.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload ? result.payload.message : 'Could not change the alert' }));
      return;
    }
    dispatch(
      showToast({
        type: 'success',
        message: isActive ? 'Notification is on' : 'Notification is off. You will not get this alert.',
      }),
    );
  };

  if (status === 'loading' && items.length === 0) {
    return (
      <View style={styles.skeleton}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} height={64} style={styles.skeletonBlock} />
        ))}
      </View>
    );
  }
  if (status === 'failed' && items.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const renderItem = ({ item }) => {
    const period = describePeriod(item);
    const color = item.active ? colors.statusOnline : colors.textSecondary;
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
            <Icon source={item.active ? 'bell-ring-outline' : 'bell-off-outline'} size={20} color={color} />
          </View>
          <View style={styles.text}>
            <AppText numberOfLines={2}>{item.name}</AppText>
            <AppText variant="caption" color={color}>
              {item.active ? 'On' : 'Off'}
            </AppText>
            {!!period && (
              <AppText variant="caption" color={colors.textSecondary}>
                {period}
              </AppText>
            )}
          </View>
          <Switch
            value={!!item.active}
            disabled={savingAlertId === item.id}
            onValueChange={(value) => handleToggle(item, value)}
            color={colors.primary}
          />
        </View>
      </Card>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={styles.list}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      refreshControl={<RefreshControl refreshing={status === 'loading'} onRefresh={refresh} />}
      ListHeaderComponent={
        <View style={styles.header}>
          <AppText variant="subtitle">{vehicle ? vehicle.device_name : 'Alerts'}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {`${Math.max(total, items.length)} ${Math.max(total, items.length) === 1 ? 'alert' : 'alerts'} on this vehicle. Use the switch to turn a notification off.`}
          </AppText>
        </View>
      }
      ListEmptyComponent={<EmptyState text="No alerts are set on this vehicle" />}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
    />
  );
}
