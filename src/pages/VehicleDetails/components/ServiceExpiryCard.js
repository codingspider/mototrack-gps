// "Service expires" card: expiry date, days left (colored by urgency) and the red Renew now button.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { showToast } from '../../../store/slices/toastSlice';
import { formatDateOnly, getDaysLeft } from '../../../utils/formatDate';
import { spacing, useAppTheme } from '../../../theme';

const SOON_DAYS = 30; // amber when this close to the expiry date

/** Text and color for the "days left" line. */
function getDaysLeftInfo(daysLeft, colors) {
  if (daysLeft === null) {
    return { text: 'No expiry date set', color: colors.textSecondary };
  }
  if (daysLeft < 0) {
    return { text: `Expired ${Math.abs(daysLeft)} ${Math.abs(daysLeft) === 1 ? 'day' : 'days'} ago`, color: colors.secondary };
  }
  if (daysLeft === 0) {
    return { text: 'Expires today', color: colors.secondary };
  }
  const text = `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`;
  return { text, color: daysLeft <= SOON_DAYS ? colors.accent : colors.statusOnline };
}

export default function ServiceExpiryCard({ vehicleId }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const expirationDate = vehicle?.details?.expiration_date;
  const daysLeftInfo = getDaysLeftInfo(getDaysLeft(expirationDate), colors);

  // The payment flow is built later; the server decides prices and expiry, never the app.
  const handleRenew = () => dispatch(showToast({ type: 'info', message: 'Renewal is coming soon' }));

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.info}>
          <AppText variant="caption" color={colors.textSecondary}>
            Service expires
          </AppText>
          <AppText variant="subtitle">{formatDateOnly(expirationDate)}</AppText>
          <AppText variant="caption" color={daysLeftInfo.color} style={styles.daysLeft}>
            {daysLeftInfo.text}
          </AppText>
        </View>
        <AppButton title="Renew now" variant="secondary" isCompact onPress={handleRenew} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: spacing.md },
  info: { flex: 1 },
  daysLeft: { fontWeight: '800' },
});
