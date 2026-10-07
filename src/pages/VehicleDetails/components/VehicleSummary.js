// Top card of the details page: name, plate, status and live speed. Reads the live vehicle from Redux.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/vehicle/StatusBadge';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { formatTimeAgo } from '../../../utils/formatDate';
import { getStatusColor } from '../../../utils/vehicleStatus';
import { spacing, useAppTheme } from '../../../theme';

export default function VehicleSummary({ vehicleId }) {
  const { colors } = useAppTheme();
  const vehicle = useSelector(selectVehicleById(vehicleId));
  if (!vehicle) {
    return null;
  }
  const speed = Math.round(Number(vehicle.live_speed) || 0);

  return (
    <Card>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="subtitle">{vehicle.device_name}</AppText>
          {!!vehicle.plate_number && (
            <AppText variant="caption" color={colors.textSecondary}>
              {vehicle.plate_number}
            </AppText>
          )}
        </View>
        <StatusBadge status={vehicle.status} />
      </View>
      <View style={styles.row}>
        <View>
          <AppText variant="title" color={getStatusColor(vehicle.status, colors)}>
            {speed} km/h
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            Updated {formatTimeAgo(vehicle.last_position_stamp).toLowerCase()}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  info: { flex: 1, marginRight: spacing.sm },
});
