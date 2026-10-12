// The four summary boxes of the Fuel alert report: total alerts, fillings, theft / drops, vehicles with alerts.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

const litres = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} L`;

/** @param {object} data Parsed report (see parseFuelAlertReport) */
export default function FuelAlertSummaryCards({ data }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'total', icon: 'water', color: colors.secondary, label: 'Total Fuel Alerts', value: String(data.totalAlerts), note: '' },
    {
      key: 'fill',
      icon: 'arrow-up-bold',
      color: colors.statusOnline,
      label: 'Fuel Fillings',
      value: String(data.fillings),
      note: data.fillings > 0 ? litres(data.fillTotal) : '',
    },
    {
      key: 'theft',
      icon: 'arrow-down-bold',
      color: colors.accent,
      label: 'Fuel Theft / Drops',
      value: String(data.thefts),
      note: data.thefts > 0 ? litres(data.theftTotal) : '',
    },
    { key: 'vehicles', icon: 'car', color: colors.info, label: 'Vehicles with Fuel Alerts', value: String(data.vehicles), note: '' },
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
              <AppText variant="caption" color={item.color} style={styles.label} numberOfLines={2}>
                {item.label}
              </AppText>
              <AppText variant="subtitle" style={styles.value} numberOfLines={1}>
                {item.value}
              </AppText>
              {!!item.note && (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {item.note}
                </AppText>
              )}
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
  label: { fontWeight: '700' },
  value: { fontWeight: '800' },
});
