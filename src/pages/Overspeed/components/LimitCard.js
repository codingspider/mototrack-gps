// The card at the top of the Overspeed page: big number with −/+ buttons, quick limits, Remove and Save.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { MAX_LIMIT_KMH, MIN_LIMIT_KMH } from '../../../store/slices/overspeedSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const STEP_KMH = 5;
const QUICK_LIMITS = [40, 60, 80, 100];

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.md, padding: spacing.lg, borderRadius: radius.lg },
    stepper: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    round: { margin: 0, width: 52, height: 52, borderRadius: radius.round, backgroundColor: colors.border },
    center: { alignItems: 'center' },
    number: { fontSize: 56, lineHeight: 64, fontWeight: '800' },
    quickRow: { flexDirection: 'row', gap: spacing.sm },
    chip: { flex: 1, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.surface, overflow: 'hidden' },
    chipActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    chipContent: { alignItems: 'center', paddingVertical: spacing.sm },
    chipText: { fontWeight: '700', fontSize: 13 },
    buttons: { flexDirection: 'row', gap: spacing.md },
    grow: { flex: 1 },
  });

/**
 * @param {number} value The limit shown now (what the user is choosing)
 * @param {function} onChange Called with the new limit
 * @param {number|null} savedLimit The limit the server has (null = none)
 * @param {boolean} isSaving A save is running
 * @param {function} onSave
 * @param {function} onRemove
 */
export default function LimitCard({ value, onChange, savedLimit, isSaving, onSave, onRemove }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const clamp = (next) => Math.min(Math.max(next, MIN_LIMIT_KMH), MAX_LIMIT_KMH);

  return (
    <Card style={styles.card}>
      <AppText color={colors.textSecondary}>Send me an alert when this vehicle goes faster than</AppText>
      <View style={styles.stepper}>
        <IconButton icon="minus" size={26} iconColor={colors.text} style={styles.round} onPress={() => onChange(clamp(value - STEP_KMH))} accessibilityLabel="Lower the limit" />
        <View style={styles.center}>
          <AppText color={colors.primary} style={styles.number}>
            {value}
          </AppText>
          <AppText color={colors.textSecondary} style={styles.chipText}>
            km/h
          </AppText>
        </View>
        <IconButton icon="plus" size={26} iconColor={colors.text} style={styles.round} onPress={() => onChange(clamp(value + STEP_KMH))} accessibilityLabel="Raise the limit" />
      </View>
      <View style={styles.quickRow}>
        {QUICK_LIMITS.map((limit) => {
          const isActive = limit === value;
          return (
            <TouchableRipple key={limit} style={[styles.chip, isActive && styles.chipActive]} onPress={() => onChange(limit)}>
              <View style={styles.chipContent}>
                <AppText color={isActive ? colors.textOnPrimary : colors.text} style={styles.chipText}>
                  {limit} km/h
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
      </View>
      <View style={styles.buttons}>
        <AppButton title="Remove" variant="link" onPress={onRemove} isDisabled={savedLimit === null || isSaving} style={styles.grow} />
        <AppButton title="Save limit" onPress={onSave} isLoading={isSaving} isDisabled={value === savedLimit} style={styles.grow} />
      </View>
    </Card>
  );
}
