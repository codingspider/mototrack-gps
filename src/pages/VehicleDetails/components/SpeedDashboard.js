// The speedometer page of the summary card: total km on the left, the live speedometer in the middle and today's
// km on the right. Under them, on one line: the speed, the status (Moving / Idling / Engine Off / Offline) and since
// when.
// Everything is read from Redux, so the needle, the status and the numbers move with every live update.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import StatusBadge from '../../../components/vehicle/StatusBadge';
import useNow from '../../../hooks/useNow';
import { useTranslation } from '../../../i18n/LanguageContext';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { getStatusLineText } from '../../../utils/statusTime';
import { getTravelNumbers } from '../../../utils/vehicleTravel';
import { spacing, useAppTheme } from '../../../theme';
import OdometerBox from './OdometerBox';
import SpeedGauge from './SpeedGauge';

// Both distances are whole kilometres (rounded), in the same six boxes
const ODOMETER_DIGITS = 6;

/**
 * @param {number} vehicleId The vehicle (read from Redux, so it is live)
 * @param {number} minHeight Same height as the summary page next to it, so the card does not jump when swiping
 */
export default function SpeedDashboard({ vehicleId, minHeight }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const nowMs = useNow(); // keeps "5 min ago" counting
  if (!vehicle) {
    return null;
  }
  const speed = Math.round(Number(vehicle.live_speed) || 0);
  const { todayKm, totalKm } = getTravelNumbers(vehicle);

  return (
    <Card style={[styles.card, { minHeight }]}>
      <View style={styles.row}>
        <OdometerBox caption={t('dash.total')} value={totalKm} integerDigits={ODOMETER_DIGITS} />
        <View style={styles.center}>
          <SpeedGauge speed={speed} />
        </View>
        <OdometerBox caption={t('dash.today')} value={todayKm} integerDigits={ODOMETER_DIGITS} />
      </View>
      <View style={styles.liveRow}>
        <View style={styles.speedRow}>
          <AppText variant="title" color={colors.text}>
            {speed}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} style={styles.unit}>
            km/h
          </AppText>
        </View>
        <StatusBadge status={vehicle.status} />
        <AppText
          variant="caption"
          color={colors.textSecondary}
          style={styles.statusTime}
          numberOfLines={1}
          adjustsFontSizeToFit
          minimumFontScale={0.8}
        >
          {getStatusLineText(vehicle, t, nowMs)}
        </AppText>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.sm, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center', flexShrink: 1 },
  // speed, status and time side by side under the dial
  liveRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.xs,
  },
  speedRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs },
  unit: { fontWeight: '700', paddingBottom: 4 },
  statusTime: { flexShrink: 1 },
});
