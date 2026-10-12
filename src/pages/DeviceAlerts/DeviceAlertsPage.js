// The alerts (notifications) of one vehicle: same rows as the Alerts tab, only this vehicle's. Opens with `{ id }`.
// Switching alarms on or off is in Profile > Alarm settings.
import React, { useCallback } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import { fetchDeviceAlerts, fetchMoreDeviceAlerts, selectDeviceAlerts } from '../../store/slices/deviceAlertsSlice';
import routeNames from '../../routes/routeNames';
import { spacing, useAppTheme } from '../../theme';
import AlertRow from '../Notifications/components/AlertRow';
import NotificationsSkeleton from '../Notifications/NotificationsSkeleton';

export default function DeviceAlertsPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const { items, status, error, isLoadingMore } = useSelector(selectDeviceAlerts(id));
  const isLoading = status === 'loading';

  // Every time the page comes into view: loads when missing or stale (see the thunk condition)
  useFocusEffect(
    useCallback(() => {
      dispatch(fetchDeviceAlerts({ deviceId: id }));
    }, [dispatch, id]),
  );

  const refresh = useCallback(() => dispatch(fetchDeviceAlerts({ deviceId: id, force: true })), [dispatch, id]);
  const loadMore = useCallback(() => dispatch(fetchMoreDeviceAlerts({ deviceId: id })), [dispatch, id]);
  const openAlert = useCallback(
    (alert) => navigation.navigate(routeNames.alertLocation, { alertId: alert.id }),
    [navigation],
  );
  const renderItem = useCallback(({ item }) => <AlertRow item={item} onPress={openAlert} />, [openAlert]);

  if (isLoading && items.length === 0) {
    return <NotificationsSkeleton />;
  }
  if (status === 'failed' && items.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <FlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={<EmptyState text="No alerts for this vehicle yet" />}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: spacing.md, paddingBottom: spacing.xxl },
  footer: { padding: spacing.md },
});
