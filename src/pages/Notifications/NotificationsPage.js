// Alerts: the events from the customer's vehicles (overspeed, geofence, ignition...), newest first.
// It opens on TODAY's alerts. Scroll down to load more of today; "Show older alerts" adds the days before, which then
// also load page by page while scrolling. Pull to refresh goes back to today. Tap an alert to open that vehicle.
import React, { useCallback, useLayoutEffect, useMemo } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import { renderBackToHomeButton } from '../../components/common/BackToHomeButton';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import routeNames from '../../routes/routeNames';
import { fetchAlarmSettings, selectDisabledAlarmNames } from '../../store/slices/alarmSettingsSlice';
import { isAlertHidden } from '../../utils/alarmSettings';
import {
  fetchMoreNotifications,
  fetchNotifications,
  fetchOlderNotifications,
  markAlertsSeen,
  selectNotifications,
} from '../../store/slices/notificationsSlice';
import { spacing, useAppTheme } from '../../theme';
import AlertRow from './components/AlertRow';
import NotificationsSkeleton from './NotificationsSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

export default function NotificationsPage() {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const tabBarSpace = useTabBarSpace();
  const {
    items: todayItems,
    olderItems,
    status,
    error,
    isLoadingMore,
    isShowingOlder,
    olderStatus,
    currentPage,
    lastPage,
    olderPage,
    olderLastPage,
    total,
  } = useSelector(selectNotifications);
  // Alerts about an alarm the customer switched off in Alarm settings are not shown
  const disabledAlarmNames = useSelector(selectDisabledAlarmNames);
  const items = useMemo(
    () => [...todayItems, ...olderItems].filter((item) => !isAlertHidden(item, disabledAlarmNames)),
    [todayItems, olderItems, disabledAlarmNames],
  );
  // The first older alert gets a small "Earlier alerts" title above it
  const firstOlderId = useMemo(() => {
    const olderIds = new Set(olderItems.map((item) => item.id));
    const first = items.find((item) => olderIds.has(item.id));
    return first ? first.id : null;
  }, [items, olderItems]);
  const isLoading = status === 'loading';
  const isLoadingOlder = olderStatus === 'loading';
  const hasMoreToday = currentPage < lastPage;
  const hasMoreOlder = olderPage < olderLastPage;

  // Back arrow in the header: back to Home
  useLayoutEffect(() => {
    navigation.setOptions({ headerLeft: renderBackToHomeButton });
  }, [navigation]);

  // Every time the tab comes into view: loads when missing or stale (see the thunk condition), so new alerts show,
  // and then everything on screen counts as seen (the number on the tab goes away)
  useFocusEffect(
    useCallback(() => {
      let isActive = true;
      const run = async () => {
        await dispatch(fetchNotifications());
        if (isActive) {
          dispatch(markAlertsSeen());
        }
      };
      run();
      dispatch(fetchAlarmSettings()); // which alarms are off (skipped when fresh)
      return () => {
        isActive = false;
      };
    }, [dispatch]),
  );

  const refresh = useCallback(async () => {
    await dispatch(fetchNotifications({ force: true }));
    dispatch(markAlertsSeen());
  }, [dispatch]);

  // Lazy loading: more of today first; once the older days were asked for, more of them
  const loadMore = useCallback(() => {
    if (isShowingOlder) {
      dispatch(fetchOlderNotifications());
    } else {
      dispatch(fetchMoreNotifications());
    }
  }, [dispatch, isShowingOlder]);
  const showOlder = useCallback(() => dispatch(fetchOlderNotifications()), [dispatch]);

  const openAlert = useCallback(
    (alert) => navigation.navigate(routeNames.alertLocation, { alertId: alert.id }),
    [navigation],
  );
  const renderItem = useCallback(
    ({ item }) => (
      <View>
        {item.id === firstOlderId && (
          <AppText variant="caption" color={colors.textSecondary} style={styles.sectionTitle}>
            {t('alerts.earlier')}
          </AppText>
        )}
        <AlertRow item={item} onPress={openAlert} />
      </View>
    ),
    [firstOlderId, openAlert, colors.textSecondary, t],
  );

  if (isLoading && items.length === 0) {
    return <NotificationsSkeleton />;
  }
  if (status === 'failed' && items.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  // The end of the list: a spinner while loading, or the button for the older days
  let footer = null;
  if (isLoadingMore || isLoadingOlder) {
    footer = <ActivityIndicator color={colors.primary} style={styles.footer} />;
  } else if (!isShowingOlder && !hasMoreToday && status === 'succeeded') {
    footer = (
      <View style={styles.footer}>
        <AppButton title={t('alerts.showOlder')} icon="history" variant="link" onPress={showOlder} />
      </View>
    );
  } else if (isShowingOlder && olderStatus === 'failed' && hasMoreOlder) {
    footer = (
      <View style={styles.footer}>
        <AppButton title={t('common.retry')} variant="link" onPress={showOlder} />
      </View>
    );
  }

  const header =
    total > 0 ? (
      <AppText variant="caption" color={colors.textSecondary} style={styles.summary}>
        {total === 1 ? t('alerts.todayOne') : t('alerts.todayCount', { n: total })}
      </AppText>
    ) : null;

  return (
    <FlatList
      style={[styles.list, { backgroundColor: colors.background }]}
      contentContainerStyle={[[styles.content, { paddingBottom: tabBarSpace }], refreshSlot]}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      onEndReached={loadMore}
      onEndReachedThreshold={0.4}
      ListHeaderComponent={header}
      ListEmptyComponent={<EmptyState text={t('alerts.noneToday')} />}
      ListFooterComponent={footer}
      refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
    />
  );
}

const styles = StyleSheet.create({
  list: { flex: 1 },
  content: { padding: spacing.md },
  footer: { padding: spacing.md, alignItems: 'center' },
  summary: { marginBottom: spacing.sm },
  sectionTitle: { fontWeight: '700', marginTop: spacing.sm, marginBottom: spacing.sm },
});
