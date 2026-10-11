// One vehicle in a list: picture badge, name, plate, status, speed and how long ago it reported.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../common/AppText';
import Card from '../common/Card';
import StatusBadge from './StatusBadge';
import VehicleIconBadge from './VehicleIconBadge';
import { formatTimeAgo } from '../../utils/formatDate';
import { getTravelSummary } from '../../utils/vehicleTravel';
import { spacing, useAppTheme } from '../../theme';

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {function} onPress Called with the vehicle id
 */
function VehicleRow({ vehicle, onPress }) {
  const { colors } = useAppTheme();
  const speed = Math.round(Number(vehicle.live_speed) || 0);
  const travel = getTravelSummary(vehicle);

  return (
    <Card style={styles.card} onPress={() => onPress(vehicle.id)}>
      <View style={styles.content}>
        <VehicleIconBadge vehicle={vehicle} />
        <View style={styles.info}>
          <AppText variant="subtitle" numberOfLines={1}>
            {vehicle.device_name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {vehicle.plate_number || 'No plate'}
          </AppText>
          {!!vehicle.address && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {vehicle.address}
            </AppText>
          )}
          <View style={styles.travel}>
            <AppText variant="caption" color={colors.textSecondary}>
              {`Today ${travel.today || '-'}`}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {`Total ${travel.total || '-'}`}
            </AppText>
          </View>
        </View>
        <View style={styles.state}>
          <StatusBadge status={vehicle.status} />
          <AppText style={styles.speed}>{`${speed} km/h`}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {formatTimeAgo(vehicle.last_position_stamp)}
          </AppText>
        </View>
      </View>
    </Card>
  );
}

// A list of many vehicles: skip re-drawing rows whose vehicle object did not change
export default React.memo(VehicleRow);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, padding: spacing.md },
  content: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md },
  info: { flex: 1 },
  state: { alignItems: 'flex-end', gap: spacing.xs },
  speed: { fontWeight: '700' },
  travel: { flexDirection: 'row', gap: spacing.md, marginTop: 2 },
});
