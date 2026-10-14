// Warranty (opened from Profile): the warranty countdown of every device, soonest to run out first.
// Data comes from GET /warranty-check (all devices); the countdown keeps running on the phone.
import React, { useCallback, useEffect, useState } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import AppText from '../../components/common/AppText';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/skeleton/Skeleton';
import { useTranslation } from '../../i18n/LanguageContext';
import { fetchWarranties, selectWarranty } from '../../store/slices/warrantySlice';
import { countWarranties } from '../../utils/warranty';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import WarrantyRow from './components/WarrantyRow';

const TICK_MS = 30 * 1000; // the countdown shows minutes, so half a minute is often enough

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    summary: { marginBottom: spacing.md },
    skeleton: { padding: spacing.md, gap: spacing.sm },
    skeletonBlock: { borderRadius: radius.md },
  });

export default function WarrantyPage() {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { items, status, error, fetchedAt } = useSelector(selectWarranty);
  const isLoading = status === 'loading';
  const [nowMs, setNowMs] = useState(Date.now());

  // Loads only if missing or stale (see the thunk condition)
  useEffect(() => {
    dispatch(fetchWarranties());
  }, [dispatch]);

  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const refresh = useCallback(() => dispatch(fetchWarranties({ force: true })), [dispatch]);
  const renderItem = useCallback(
    ({ item }) => <WarrantyRow item={item} fetchedAt={fetchedAt} nowMs={nowMs} />,
    [fetchedAt, nowMs],
  );

  if (isLoading && items.length === 0) {
    return (
      <View style={styles.skeleton}>
        {[0, 1, 2, 3].map((index) => (
          <Skeleton key={index} height={150} style={styles.skeletonBlock} />
        ))}
      </View>
    );
  }
  if (status === 'failed' && items.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const counts = countWarranties(items);

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.list, refreshSlot]}
      data={items}
      keyExtractor={(item) => String(item.deviceId)}
      renderItem={renderItem}
      extraData={nowMs}
      refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
      ListHeaderComponent={
        items.length === 0 ? null : (
          <AppText variant="caption" color={colors.textSecondary} style={styles.summary}>
            {t('warranty.summary', { active: counts.active, expired: counts.expired })}
          </AppText>
        )
      }
      ListEmptyComponent={<EmptyState text={t('warranty.none')} />}
    />
  );
}
