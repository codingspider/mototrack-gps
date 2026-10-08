// Top part of the info card: name, plate, status, and the live speed with the last update time.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import StatusBadge from '../../../components/vehicle/StatusBadge';
import VehicleIconBadge from '../../../components/vehicle/VehicleIconBadge';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { formatTimeAgo } from '../../../utils/formatDate';
import { getStatusColor } from '../../../utils/vehicleStatus';
import { spacing, useAppTheme } from '../../../theme';

const ICON_BADGE_SIZE = 40;

export default function VehicleSummary({ vehicleId }) {
  const { colors } = useAppTheme();
  const vehicle = useSelector(selectVehicleById(vehicleId));
  if (!vehicle) {
    return null;
  }
  const speed = Math.round(Number(vehicle.live_speed) || 0);

  return (
    <View>
      <View style={styles.row}>
        <VehicleIconBadge vehicle={vehicle} size={ICON_BADGE_SIZE} />
        <View style={styles.info}>
          <AppText variant="subtitle" numberOfLines={1}>
            {vehicle.device_name}
          </AppText>
          {!!vehicle.plate_number && (
            <AppText variant="caption" color={colors.textSecondary}>
              {vehicle.plate_number}
            </AppText>
          )}
        </View>
        <StatusBadge status={vehicle.status} />
      </View>
      <View style={styles.speedRow}>
        {/* spacer so the speed lines up with the name, not the icon */}
        <View style={styles.iconSpacer} />
        <AppText variant="subtitle" color={getStatusColor(vehicle.status, colors)}>
          {speed} km/h
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          Updated {formatTimeAgo(vehicle.last_position_stamp).toLowerCase()}
        </AppText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  info: { flex: 1, marginHorizontal: spacing.sm },
  speedRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.sm },
  iconSpacer: { width: ICON_BADGE_SIZE },
});
