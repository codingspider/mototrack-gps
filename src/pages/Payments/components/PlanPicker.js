// Step 2 card: choose one plan (radio rows) and how many periods to pay for (quantity stepper).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, RadioButton, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { MAX_QUANTITY, formatMoney } from '../../../utils/payments';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
    planBox: { borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, overflow: 'hidden' },
    planRow: { flexDirection: 'row', alignItems: 'center', paddingRight: spacing.md },
    planActive: { borderColor: colors.primary },
    planText: { flex: 1 },
    price: { fontWeight: '800' },
    quantity: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingLeft: spacing.md,
    },
    stepper: { flexDirection: 'row', alignItems: 'center' },
    count: { minWidth: 28, textAlign: 'center', fontWeight: '800' },
  });

/**
 * @param {object[]} plans From GET /device-plans
 * @param {number|null} selectedPlanId
 * @param {function} onSelectPlan Called with the plan id
 * @param {number} quantity Number of plan periods
 * @param {function} onChangeQuantity
 */
export default function PlanPicker({ plans, selectedPlanId, onSelectPlan, quantity, onChangeQuantity }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card style={styles.card}>
      <AppText variant="subtitle">2. Choose plan</AppText>
      {plans.length === 0 && <AppText color={colors.textSecondary}>No plans are available right now.</AppText>}
      {plans.map((plan) => {
        const isSelected = plan.id === selectedPlanId;
        return (
          <TouchableRipple key={plan.id} onPress={() => onSelectPlan(plan.id)} style={[styles.planBox, isSelected && styles.planActive]}>
            <View style={styles.planRow}>
              <RadioButton value={String(plan.id)} status={isSelected ? 'checked' : 'unchecked'} color={colors.primary} />
              <View style={styles.planText}>
                <AppText numberOfLines={1}>{plan.title}</AppText>
                <AppText variant="caption" color={colors.textSecondary}>
                  {plan.duration_text || `${plan.duration_value} ${plan.duration_type}`}
                </AppText>
              </View>
              <AppText style={styles.price}>{formatMoney(plan.price)}</AppText>
            </View>
          </TouchableRipple>
        );
      })}
      <View style={styles.quantity}>
        <View>
          <AppText>Quantity</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {selectedPlanId ? 'Number of periods to pay for' : 'Choose a plan'}
          </AppText>
        </View>
        <View style={styles.stepper}>
          <IconButton
            icon="minus"
            size={18}
            disabled={!selectedPlanId || quantity <= 1}
            onPress={() => onChangeQuantity(quantity - 1)}
          />
          <AppText style={styles.count}>{quantity}</AppText>
          <IconButton
            icon="plus"
            size={18}
            iconColor={colors.primary}
            disabled={!selectedPlanId || quantity >= MAX_QUANTITY}
            onPress={() => onChangeQuantity(quantity + 1)}
          />
        </View>
      </View>
    </Card>
  );
}
