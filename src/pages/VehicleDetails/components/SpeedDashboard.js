// The speedometer page of the summary card: total km on the left, the live speedometer in the middle and today's
// km on the right. Everything is read from Redux, so the needle and the numbers move with every live position.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { useTranslation } from '../../../i18n/LanguageContext';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
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
          <View style={styles.speedRow}>
            <AppText variant="title" color={colors.text}>
              {speed}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary} style={styles.unit}>
              km/h
            </AppText>
          </View>
        </View>
        <OdometerBox caption={t('dash.today')} value={todayKm} integerDigits={ODOMETER_DIGITS} />
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.sm, justifyContent: 'center' },
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  center: { alignItems: 'center' },
  speedRow: { flexDirection: 'row', alignItems: 'flex-end', gap: spacing.xs, marginTop: spacing.xs },
  unit: { fontWeight: '700', paddingBottom: 4 },
});
