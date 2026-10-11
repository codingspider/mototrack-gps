// What the customer sees after the DGePay page: checking, paid (with the new expiry dates) or not completed.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import Skeleton from '../../../components/skeleton/Skeleton';
import { formatDateOnly } from '../../../utils/formatDate';
import { formatMoney } from '../../../utils/payments';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, padding: spacing.md, gap: spacing.md, backgroundColor: colors.background },
    center: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.lg },
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', gap: spacing.md },
    name: { flex: 1 },
    bold: { fontWeight: '700' },
    center_text: { textAlign: 'center' },
  });

/**
 * @param {object} checkout From paymentsSlice (status, error, result, amount, planTitle)
 * @param {function} onCheckAgain Ask the server again (the payment may still be processing)
 * @param {function} onDone
 * @param {function} onBack
 */
export default function PaymentResult({ checkout, onCheckAgain, onDone, onBack }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  if (checkout.status === 'confirming' || checkout.status === 'starting') {
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <AppText variant="subtitle">Confirming your payment…</AppText>
          <AppText color={colors.textSecondary} style={styles.center_text}>
            Please wait, do not close the app.
          </AppText>
        </View>
        <Skeleton height={120} />
      </View>
    );
  }

  if (checkout.status === 'succeeded') {
    const devices = (checkout.result && checkout.result.devices) || [];
    const failed = (checkout.result && checkout.result.failed) || [];
    return (
      <View style={styles.screen}>
        <View style={styles.center}>
          <Icon source="check-circle" size={64} color={colors.success} />
          <AppText variant="title">Payment successful</AppText>
          <AppText color={colors.textSecondary}>{`${formatMoney(checkout.amount)} · ${checkout.planTitle || 'Renewal'}`}</AppText>
        </View>
        <Card style={styles.card}>
          {devices.map((device) => (
            <View key={device.device_id} style={styles.row}>
              <AppText style={styles.name} numberOfLines={1}>
                {device.device_name}
              </AppText>
              <AppText style={styles.bold}>{`Until ${formatDateOnly(device.device_expiration)}`}</AppText>
            </View>
          ))}
          {failed.length > 0 && (
            <AppText color={colors.secondary}>
              {`${failed.length} vehicle(s) could not be renewed. Please contact support with your payment receipt.`}
            </AppText>
          )}
        </Card>
        <AppButton title="Done" onPress={onDone} />
      </View>
    );
  }

  // 'failed' (a payment that could not start never gets here: the Payments page shows a toast instead)
  return (
    <View style={styles.screen}>
      <View style={styles.center}>
        <Icon source="alert-circle" size={64} color={colors.secondary} />
        <AppText variant="title">Payment not completed</AppText>
        <AppText color={colors.textSecondary} style={styles.center_text}>
          {checkout.error || 'We could not confirm your payment.'}
        </AppText>
      </View>
      {!!checkout.transactionId && <AppButton title="Check payment again" onPress={onCheckAgain} />}
      <AppButton title="Back" variant="link" onPress={onBack} />
    </View>
  );
}
