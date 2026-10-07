// One vehicle row: name, plate, status, live speed and last update (Bangladesh time).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import Card from '../common/Card';
import AppText from '../common/AppText';
import StatusBadge from './StatusBadge';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { formatBdDateTime } from '../../utils/formatDate';
import { colors, spacing } from '../../theme';

/** Reads the vehicle from Redux by id, so it updates live from the socket. */
export default function VehicleCard({ vehicleId }) {
  const vehicle = useSelector(selectVehicleById(vehicleId));
  if (!vehicle) {
    return null;
  }
  const speed = Math.round(vehicle.live_speed || 0);

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="subtitle">{vehicle.device_name}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {vehicle.plate_number || '-'}
          </AppText>
        </View>
        <StatusBadge status={vehicle.status} />
      </View>
      <View style={styles.row}>
        <AppText variant="body">{speed} km/h</AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {formatBdDateTime(vehicle.last_position_stamp)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.md },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  info: { flex: 1, marginRight: spacing.sm },
});