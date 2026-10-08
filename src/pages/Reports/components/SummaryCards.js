// Three small number cards under the filters (distance, trips, top speed...).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

/** @param {Array<{label, value, unit}>} items */
export default function SummaryCards({ items }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      {items.map((item) => (
        <Card key={item.label} style={styles.card}>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
            {item.label}
          </AppText>
          <View style={styles.valueRow}>
            <AppText variant="subtitle" numberOfLines={1} adjustsFontSizeToFit style={styles.value}>
              {item.value}
            </AppText>
            {!!item.unit && (
              <AppText variant="caption" color={colors.textSecondary}>
                {item.unit}
              </AppText>
            )}
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  card: { flex: 1, padding: spacing.md, borderRadius: radius.lg },
  valueRow: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.xs },
  value: { flexShrink: 1, fontWeight: '800' },
});
