// "Recent Activities" from the design: every vehicle that moved in the last 3 hours (parked or offline now included),
// the one that moved last first. Live from Redux; the server's "moved" times are asked again every minute.
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/vehicle/StatusBadge';
import VehicleIconBadge from '../../../components/vehicle/VehicleIconBadge';
import routeNames from '../../../routes/routeNames';
import { fetchRecentMoves, selectAllVehicles } from '../../../store/slices/vehiclesSlice';
import { formatSinceTime } from '../../../utils/statusTime';
import { RECENT_ACTIVITY_HOURS, getRecentActivityVehicles } from '../../../utils/recentActivity';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

const NOW_TICK_MS = 60 * 1000;

const makeStyles = (colors) =>
  StyleSheet.create({
    titleRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    row: {
      marginBottom: spacing.sm,
      padding: spacing.md,
      borderRadius: radius.lg,
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    rowContent: { flexDirection: 'row', alignItems: 'center' },
    plate: { flex: 1, marginHorizontal: spacing.md, fontWeight: '700' },
    state: { alignItems: 'center', marginRight: spacing.sm },
    speed: { width: 62, textAlign: 'right', fontWeight: '700' },
    empty: { paddingVertical: spacing.md, textAlign: 'center' },
  });

function ActivityRow({ vehicle }) {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const speed = Math.round(vehicle.live_speed || 0);
  // Only the id goes in the params; the details page reads the live vehicle from Redux
  const openDetails = () => navigation.navigate(routeNames.vehicleDetails, { id: vehicle.id });

  return (
    <Card style={styles.row} onPress={openDetails}>
      <View style={styles.rowContent}>
        <VehicleIconBadge vehicle={vehicle} />
        <AppText style={styles.plate} numberOfLines={2}>
          {vehicle.plate_number || vehicle.device_name}
        </AppText>
        <View style={styles.state}>
          <StatusBadge status={vehicle.status} />
          {/* When the tracker last reported, in Bangladesh time: "10:24 AM" today, "17 Oct, 08:40 AM" earlier */}
          <AppText variant="caption" color={colors.textSecondary}>
            {vehicle.last_position_stamp ? formatSinceTime(Number(vehicle.last_position_stamp)) : '-'}
          </AppText>
        </View>
        <AppText style={styles.speed}>{speed} km/h</AppText>
      </View>
    </Card>
  );
}

export default function RecentActivities() {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const vehicles = useSelector(selectAllVehicles);
  const hasVehicles = vehicles.length > 0;
  const { t } = useTranslation();

  const { colors } = useAppTheme();
  // The clock moves every minute, so a vehicle leaves the list when its 3 hours are over
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  // Ask the server which vehicles moved in the last 3 hours (it reads the positions), now and on every clock tick, so
  // a vehicle that moved while the socket was not listening still shows up. Skipped when asked under a minute ago.
  useEffect(() => {
    if (hasVehicles) {
      dispatch(fetchRecentMoves());
    }
  }, [dispatch, hasVehicles, nowMs]);

  const recentVehicles = useMemo(() => getRecentActivityVehicles(vehicles, nowMs), [vehicles, nowMs]);

  return (
    <View>
      <View style={styles.titleRow}>
        <AppText variant="subtitle">{t('home.recentActivities')}</AppText>
        <AppButton
          title={t('common.viewAll')}
          variant="link"
          icon="chevron-right"
          isIconRight
          onPress={() => navigation.navigate(routeNames.vehicles)}
        />
      </View>
      {recentVehicles.length === 0 && (
        <AppText variant="caption" color={colors.textSecondary} style={styles.empty}>
          {t('home.noRecent', { hours: RECENT_ACTIVITY_HOURS })}
        </AppText>
      )}
      {recentVehicles.map((vehicle) => (
        <ActivityRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </View>
  );
}
