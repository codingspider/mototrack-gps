// Step 3 card: what is in the cart, the total and the "Pay with DGePay" button.
// The total shown here is only for display and for the amount sent to DGePay; the server checks it again.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { formatMoney } from '../../../utils/payments';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
    row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    total: { fontSize: 24, lineHeight: 30, fontWeight: '800', color: colors.primary },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border },
    note: { textAlign: 'center' },
  });

/**
 * @param {object} cart { vehicleCount, plan (object|null), quantity, total }
 * @param {boolean} isStarting True while the payment is being started
 * @param {function} onPay
 */
export default function CartSummary({ cart, isStarting, onPay }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { vehicleCount, plan, quantity, total } = cart;
  const canPay = vehicleCount > 0 && !!plan;
  const hint = vehicleCount === 0 ? 'Select at least one vehicle' : 'Choose a plan';

  return (
    <Card style={styles.card}>
      <AppText variant="subtitle">3. Pay</AppText>
      <View style={styles.row}>
        <AppText color={colors.textSecondary}>Vehicles selected</AppText>
        <AppText>{vehicleCount}</AppText>
      </View>
      <View style={styles.row}>
        <AppText color={colors.textSecondary}>Duration</AppText>
        <AppText>{plan ? `${quantity} x ${plan.duration_text || plan.title}` : '-'}</AppText>
      </View>
      <View style={styles.row}>
        <AppText color={colors.textSecondary}>Price per vehicle</AppText>
        <AppText>{plan ? formatMoney(plan.price * quantity) : '-'}</AppText>
      </View>
      <View style={styles.divider} />
      <View style={styles.row}>
        <AppText>Total</AppText>
        <AppText style={styles.total}>{canPay ? formatMoney(total) : formatMoney(0)}</AppText>
      </View>
      <AppButton title="Pay with DGePay" variant="secondary" icon="lock" isLoading={isStarting} isDisabled={!canPay} onPress={onPay} />
      {!canPay && (
        <AppText variant="caption" color={colors.textSecondary} style={styles.note}>
          {hint}
        </AppText>
      )}
    </Card>
  );
}
