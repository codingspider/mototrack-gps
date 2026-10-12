// The five summary boxes of the Hourly and Location reports: vehicles, total km, an average (hourly distance or
// speed), operating hours, max speed.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

const twoDecimals = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/**
 * @param {object} data Parsed report (see parseHourlyReport / parseLocationReport)
 * @param {string} avgLabel Title of the average box
 * @param {string} avgText Value of the average box (default: the hourly distance)
 */
export default function HourlySummaryCards({ data, avgLabel = 'Avg. Hourly Distance', avgText }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'vehicles', icon: 'car', color: colors.secondary, label: 'Total Vehicles', value: String(data.vehicles) },
    { key: 'km', icon: 'road-variant', color: colors.statusOnline, label: 'Total KM', value: `${twoDecimals(data.totalKm)} km` },
    { key: 'avg', icon: 'speedometer', color: colors.info, label: avgLabel, value: avgText || `${twoDecimals(data.avgHourly)} km` },
    { key: 'hours', icon: 'clock-outline', color: colors.accent, label: 'Operating Hours', value: data.operating || '-' },
    { key: 'max', icon: 'speedometer-medium', color: colors.primary, label: 'Max Speed', value: `${twoDecimals(data.maxSpeed)} km/h` },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} style={[styles.card, item.key === 'max' && styles.wide]}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Icon source={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.text}>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {item.label}
              </AppText>
              <AppText style={styles.value} numberOfLines={1}>
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
  wide: { flexBasis: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  value: { fontWeight: '800' },
});
