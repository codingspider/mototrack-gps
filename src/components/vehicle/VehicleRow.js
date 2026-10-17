// One vehicle in a list: picture badge, name, plate, speed, address, status, last location time (Bangladesh time),
// today / total distance and two quick actions (Map, Playback).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../common/AppText';
import useAddress from '../../hooks/useAddress';
import Card from '../common/Card';
import StatusBadge from './StatusBadge';
import VehicleIconBadge from './VehicleIconBadge';
import { formatBdDateTime } from '../../utils/formatDate';
import { getLastUpdateAge } from '../../utils/lastUpdateAge';
import { getTravelSummary } from '../../utils/vehicleTravel';
import { radius, spacing, useAppTheme } from '../../theme';
import { useTranslation } from '../../i18n/LanguageContext';

/** The plate line is hidden when there is no plate or the name already says it. */
function getPlateText(vehicle) {
  const plate = String(vehicle.plate_number || '').trim();
  const name = String(vehicle.device_name || '').trim().toLowerCase();
  if (!plate || name.includes(plate.toLowerCase())) {
    return '';
  }
  return plate;
}

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {function} onPress Called with the vehicle id (opens the details and map)
 * @param {function} onPlayback Called with the vehicle id (opens Playback)
 */
function VehicleRow({ vehicle, onPress, onPlayback }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const speed = Math.round(Number(vehicle.live_speed) || 0);
  const travel = getTravelSummary(vehicle);
  // The list endpoint only sends cached addresses (looking them all up made it slow): fill in the rest here
  const address = useAddress(vehicle.address, vehicle.lat, vehicle.lng);
  const plateText = getPlateText(vehicle);

  // Last location time: normal when fresh, amber after 1 hour, red after 1 day
  const age = getLastUpdateAge(vehicle.last_position_stamp);
  const timeColors = { fresh: colors.textSecondary, old: colors.warning, stale: colors.error };

  return (
    <Card style={styles.card} onPress={() => onPress(vehicle.id)}>
      <View style={styles.content}>
        <View style={styles.header}>
          <VehicleIconBadge vehicle={vehicle} />
          <View style={styles.info}>
            <AppText variant="subtitle" numberOfLines={1}>
              {vehicle.device_name}
            </AppText>
            {!!plateText && (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {plateText}
              </AppText>
            )}
          </View>
          <AppText style={styles.speed}>{`${speed} km/h`}</AppText>
        </View>

        {!!address && (
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {address}
          </AppText>
        )}

        <View style={styles.line}>
          <StatusBadge status={vehicle.status} />
          <AppText variant="caption" color={timeColors[age]} numberOfLines={1}>
            {formatBdDateTime(vehicle.last_position_stamp)}
          </AppText>
        </View>

        <View style={[styles.line, styles.footer, { borderTopColor: colors.border }]}>
          <View style={styles.travel}>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('vehicles.today', { value: travel.today || '-' })}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {t('vehicles.total', { value: travel.total || '-' })}
            </AppText>
          </View>
          <View style={styles.actions}>
            <TouchableRipple style={[styles.action, { backgroundColor: colors.primarySoft }]} onPress={() => onPress(vehicle.id)}>
              <View style={styles.actionContent}>
                <Icon source="map-marker" size={16} color={colors.primary} />
                <AppText variant="caption" color={colors.primary}>
                  {t('vehicles.actionMap')}
                </AppText>
              </View>
            </TouchableRipple>
            {!!onPlayback && (
              <TouchableRipple style={[styles.action, { backgroundColor: colors.primarySoft }]} onPress={() => onPlayback(vehicle.id)}>
                <View style={styles.actionContent}>
                  <Icon source="history" size={16} color={colors.primary} />
                  <AppText variant="caption" color={colors.primary}>
                    {t('vehicles.actionPlayback')}
                  </AppText>
                </View>
              </TouchableRipple>
            )}
          </View>
        </View>
      </View>
    </Card>
  );
}

// A list of many vehicles: skip re-drawing rows whose vehicle object did not change
export default React.memo(VehicleRow);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, padding: spacing.md },
  content: { gap: spacing.sm },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  info: { flex: 1 },
  speed: { fontWeight: '700' },
  line: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.sm },
  footer: { borderTopWidth: StyleSheet.hairlineWidth, paddingTop: spacing.sm },
  travel: { flex: 1, flexDirection: 'row', gap: spacing.md },
  actions: { flexDirection: 'row', gap: spacing.sm },
  action: { borderRadius: radius.round, paddingHorizontal: spacing.sm, paddingVertical: spacing.xs },
  actionContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
});
