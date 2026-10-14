// One vehicle in a list: picture badge, name, plate, status, speed and how long ago it reported.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../common/AppText';
import useAddress from '../../hooks/useAddress';
import Card from '../common/Card';
import StatusBadge from './StatusBadge';
import VehicleIconBadge from './VehicleIconBadge';
import { getStatusTimeText } from '../../utils/statusTime';
import { getTravelSummary } from '../../utils/vehicleTravel';
import { spacing, useAppTheme } from '../../theme';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {function} onPress Called with the vehicle id
 */
function VehicleRow({ vehicle, onPress }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const speed = Math.round(Number(vehicle.live_speed) || 0);
  const travel = getTravelSummary(vehicle);
  // The list endpoint only sends cached addresses (looking them all up made it slow): fill in the rest here
  const address = useAddress(vehicle.address, vehicle.lat, vehicle.lng);

  return (
    <Card style={styles.card} onPress={() => onPress(vehicle.id)}>
      <View style={styles.content}>
        <VehicleIconBadge vehicle={vehicle} />
        <View style={styles.info}>
          <AppText variant="subtitle" numberOfLines={1}>
            {vehicle.device_name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {vehicle.plate_number || t('common.noPlate')}
          </AppText>
          {!!address && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
              {address}
            </AppText>
          )}
          <View style={styles.travel}>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('vehicles.today', { value: travel.today || '-' })}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('vehicles.total', { value: travel.total || '-' })}
            </AppText>
          </View>
        </View>
        <View style={styles.state}>
          <StatusBadge status={vehicle.status} />
          <AppText style={styles.speed}>{`${speed} km/h`}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {getStatusTimeText(vehicle, t)}
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
