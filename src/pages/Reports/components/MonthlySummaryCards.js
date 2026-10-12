// The three summary boxes of the Monthly distance overview: reporting period, number of vehicles, distance unit.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

/** @param {object} data Parsed report (see parseMonthlyOverview) */
export default function MonthlySummaryCards({ data }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'period', icon: 'calendar-month', color: colors.secondary, label: 'Reporting period', value: data.periodLabel || '-' },
    { key: 'vehicles', icon: 'car', color: colors.statusOnline, label: 'Vehicles', value: String(data.vehiclesCount) },
    { key: 'unit', icon: 'road-variant', color: colors.info, label: 'Distance unit', value: data.unit },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Icon source={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.text}>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {item.label}
              </AppText>
              <AppText style={styles.value} numberOfLines={2}>
                {item.value}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { flexGrow: 1, flexBasis: '47%', padding: spacing.md, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  value: { fontWeight: '800' },
});
