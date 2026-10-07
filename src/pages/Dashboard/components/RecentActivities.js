// "Recent Activities" from the design: the vehicles that reported most recently. Live from Redux.
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/vehicle/StatusBadge';
import routeNames from '../../../routes/routeNames';
import { selectAllVehicles } from '../../../store/slices/vehiclesSlice';
import { formatTimeAgo } from '../../../utils/formatDate';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

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
        <Icon source="car" size={26} color={colors.primary} />
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
  const navigation = useNavigation();
  const styles = useThemedStyles(makeStyles);
  const vehicles = useSelector(selectAllVehicles);

  const recentVehicles = useMemo(() => {
    const byLatest = (a, b) => (b.last_position_stamp || 0) - (a.last_position_stamp || 0);
    return [...vehicles].sort(byLatest); // every vehicle, the one that reported last first
  }, [vehicles]);

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
      {recentVehicles.map((vehicle) => (
        <ActivityRow key={vehicle.id} vehicle={vehicle} />
      ))}
    </View>
  );
}
