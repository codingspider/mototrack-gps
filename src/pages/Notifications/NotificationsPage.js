// Alerts: the events from the customer's vehicles (overspeed, geofence, ignition...), newest first.
// Pull to refresh, scroll down to load older ones. Tap an alert to open that vehicle.
import React, { useCallback, useEffect, useLayoutEffect } from 'react';
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { renderBackToHomeButton } from '../../components/common/BackToHomeButton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import {
  fetchMoreNotifications,
  fetchNotifications,
  selectNotifications,
} from '../../store/slices/notificationsSlice';
import { spacing, useAppTheme } from '../../theme';
import AlertRow from './components/AlertRow';
import NotificationsSkeleton from './NotificationsSkeleton';

export default function NotificationsPage() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const tabBarSpace = useTabBarSpace();
  const { items, status, error, isLoadingMore } = useSelector(selectNotifications);
  const isLoading = status === 'loading';

  // Back arrow in the header: back to Home
  useLayoutEffect(() => {
    navigation.setOptions({ headerLeft: renderBackToHomeButton });
  }, [navigation]);

  // Loads only when missing or stale (see the thunk condition)
  useEffect(() => {
    dispatch(fetchNotifications());
  }, [dispatch]);

  const refresh = useCallback(() => dispatch(fetchNotifications({ force: true })), [dispatch]);
  const loadMore = useCallback(() => dispatch(fetchMoreNotifications()), [dispatch]);
  const openVehicle = useCallback((id) => navigation.navigate(routeNames.vehicleDetails, { id }), [navigation]);
  const renderItem = useCallback(({ item }) => <AlertRow item={item} onPress={openVehicle} />, [openVehicle]);

  if (isLoading && items.length === 0) {
    return <NotificationsSkeleton />;
  }
  if (status === 'failed' && items.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <FlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={[styles.content, { paddingBottom: tabBarSpace }]}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListEmptyComponent={<EmptyState text="No alerts yet" />}
      ListFooterComponent={isLoadingMore ? <ActivityIndicator color={colors.primary} style={styles.footer} /> : null}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: spacing.md },
  footer: { padding: spacing.md },
});
