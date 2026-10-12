// "Recent Activities" from the design: the vehicles that did something in the last 3 hours (moving, idling or engine
// on), the one that reported last first. Live from Redux.
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
import { formatTimeAgo } from '../../../utils/formatDate';
import { RECENT_ACTIVITY_HOURS, getRecentActivityVehicles } from '../../../utils/recentActivity';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

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
          <AppText variant="caption" color={colors.textSecondary}>
            {formatTimeAgo(vehicle.last_position_stamp)}
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

  // Ask the server which vehicles moved in the last 3 hours (it reads the positions). Skipped when asked a minute ago.
  useEffect(() => {
    if (hasVehicles) {
      dispatch(fetchRecentMoves());
    }
  }, [dispatch, hasVehicles]);

  const { colors } = useAppTheme();
  // The clock only moves forward by itself, so a vehicle leaves the list when its 3 hours are over
  const [nowMs, setNowMs] = useState(Date.now());
  useEffect(() => {
    const timer = setInterval(() => setNowMs(Date.now()), NOW_TICK_MS);
    return () => clearInterval(timer);
  }, []);

  const recentVehicles = useMemo(() => getRecentActivityVehicles(vehicles, nowMs), [vehicles, nowMs]);

  return (
    <View>
      <View style={styles.titleRow}>
        <AppText variant="subtitle">Recent Activities</AppText>
        <AppButton
          title="View All"
          variant="link"
          icon="chevron-right"
          isIconRight
          onPress={() => navigation.navigate(routeNames.vehicles)}
        />
      </View>
      {recentVehicles.length === 0 && (
        <AppText variant="caption" color={colors.textSecondary} style={styles.empty}>
          {`No vehicle was moving, idling or running in the last ${RECENT_ACTIVITY_HOURS} hours`}
        </AppText>
      )}
      {recentVehicles.map((vehicle) => (
        <ActivityRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </View>
  );
}
