// The four summary boxes of the Vehicle activity and Movement summary reports: total vehicles, total trips, total km
// and a total time (stop time or operating time).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

const kmText = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;

/**
 * @param {object} data Parsed report (see parseActivityReport)
 * @param {string} vehicleName The chosen vehicle's name, or '' for all vehicles
 * @param {string} timeLabel Title of the last box
 * @param {string} timeValue Value of the last box (default: the stop time)
 */
export default function ActivitySummaryCards({ data, vehicleName, timeLabel = 'Total Stop Time', timeValue }) {
  const { colors } = useAppTheme();
  const items = [
    {
      key: 'vehicles',
      icon: 'car',
      color: colors.secondary,
      label: 'Total Vehicles',
      value: String(data.vehicles),
      note: `Selected: ${vehicleName || 'All Vehicles'}`,
    },
    { key: 'trips', icon: 'map-marker-path', color: colors.statusOnline, label: 'Total Trips', value: String(data.trips), note: 'Across all vehicles' },
    { key: 'km', icon: 'road-variant', color: colors.info, label: 'Total KM', value: kmText(data.totalKm), note: 'Across all vehicles' },
    { key: 'stop', icon: 'clock-outline', color: colors.accent, label: timeLabel, value: timeValue || data.stopTime, note: 'Across all vehicles' },
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
              <AppText variant="caption" color={item.color} style={styles.label}>
                {item.label}
              </AppText>
              <AppText variant="subtitle" style={styles.value} numberOfLines={1}>
                {item.value}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {item.note}
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
  label: { fontWeight: '700' },
  value: { fontWeight: '800' },
});
