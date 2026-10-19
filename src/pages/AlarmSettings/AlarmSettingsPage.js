// Alarm settings (opened from Profile): the incoming call alert switch, then the account's alarms (they cover all
// vehicles) with a switch, plus Select all / Unselect all. Per-vehicle overspeed and geofence rules are not here: they
// are set on each vehicle's page.
import React, { useCallback, useEffect } from 'react';
import { FlatList, StyleSheet, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { Icon, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/skeleton/Skeleton';
import {
  fetchAlarmSettings,
  selectAccountAlarms,
  selectAlarmSettings,
  setAlarmsActive,
} from '../../store/slices/alarmSettingsSlice';
import { useTranslation } from '../../i18n/LanguageContext';
import { showToast } from '../../store/slices/toastSlice';
import CallAlertCard from './components/CallAlertCard';
import GeofenceCallCard from './components/GeofenceCallCard';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    list: { padding: spacing.md, paddingBottom: spacing.xxl },
    header: { gap: spacing.sm, marginBottom: spacing.md },
    bulkRow: { flexDirection: 'row', gap: spacing.sm },
    bulkButton: { flex: 1 },
    card: { marginBottom: spacing.sm, padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 38, height: 38, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    skeleton: { padding: spacing.md, gap: spacing.sm },
    skeletonBlock: { borderRadius: radius.md },
  });

export default function AlarmSettingsPage() {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { status, error, isSaving } = useSelector(selectAlarmSettings);
  const items = useSelector(selectAccountAlarms);
  const isLoading = status === 'loading';
  const activeCount = items.filter((item) => item.active).length;

  useEffect(() => {
    dispatch(fetchAlarmSettings());
  }, [dispatch]);

  const refresh = useCallback(() => dispatch(fetchAlarmSettings({ force: true })), [dispatch]);

  // Only the alarms that are not already in the wanted state are sent
  const changeAlarms = async (alertIds, isActive, message) => {
    if (alertIds.length === 0) {
      return;
    }
    const result = await dispatch(setAlarmsActive({ alertIds, isActive }));
    if (setAlarmsActive.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'Could not change the alarms' }));
      return;
    }
    dispatch(showToast({ type: 'success', message }));
  };

  const selectAll = () =>
    changeAlarms(
      items.filter((item) => !item.active).map((item) => item.id),
      true,
      'All alarms are on',
    );
  const unselectAll = () =>
    changeAlarms(
      items.filter((item) => item.active).map((item) => item.id),
      false,
      'All alarms are off. You will not get these alerts.',
    );

  if (isLoading && items.length === 0) {
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
          </View>
          <Switch
            value={item.active}
            disabled={isSaving}
            onValueChange={(value) => changeAlarms([item.id], value, value ? 'Alarm is on' : 'Alarm is off')}
            color={colors.primary}
          />
        </View>
      </Card>
    );
  };

  return (
    <FlatList
      style={styles.screen}
      contentContainerStyle={[styles.list, refreshSlot]}
      data={items}
      keyExtractor={(item) => String(item.id)}
      renderItem={renderItem}
      refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
      ListHeaderComponent={
        <>
          <CallAlertCard />
          <GeofenceCallCard />
          {items.length > 0 && (
            <View style={styles.header}>
              <AppText variant="caption" color={colors.textSecondary}>
                {`${activeCount} of ${items.length} alarms are on`}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary}>
                {t(
                  'These alarms apply to all your vehicles. Overspeed limits and geofences are set on each vehicle page.',
                )}
              </AppText>
              <View style={styles.bulkRow}>
                <AppButton
                  title="Select all"
                  icon="check-all"
                  isCompact
                  isDisabled={isSaving || activeCount === items.length}
                  onPress={selectAll}
                  style={styles.bulkButton}
                />
                <AppButton
                  title="Unselect all"
                  icon="close-box-multiple-outline"
                  isCompact
                  variant="secondary"
                  isDisabled={isSaving || activeCount === 0}
                  onPress={unselectAll}
                  style={styles.bulkButton}
                />
              </View>
            </View>
          )}
        </>
      }
      ListEmptyComponent={<EmptyState text="No alarms are set up yet" />}
    />
  );
}
