// The four summary boxes of the Trip report: total trips, total km, total trip duration, average speed.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

const twoDecimals = (value) => value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });

/** @param {object} data Parsed report (see parseTripReport) */
export default function TripSummaryCards({ data }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'trips', icon: 'map-marker-path', color: colors.secondary, label: 'Total Trips', value: String(data.trips) },
    { key: 'km', icon: 'road-variant', color: colors.statusOnline, label: 'Total KM', value: `${twoDecimals(data.totalKm)} km` },
    { key: 'duration', icon: 'clock-outline', color: colors.accent, label: 'Total Trip Duration', value: data.duration },
    { key: 'speed', icon: 'speedometer', color: colors.info, label: 'Average Speed', value: `${twoDecimals(data.avgSpeed)} km/h` },
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
              <AppText variant="caption" color={item.color} style={styles.label} numberOfLines={1}>
                {item.label}
              </AppText>
              <AppText variant="subtitle" style={styles.value} numberOfLines={1}>
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
  label: { fontWeight: '700' },
  value: { fontWeight: '800' },
});
