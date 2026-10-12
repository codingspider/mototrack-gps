// The three speed boxes of the Speed report: max speed, min speed and average speed, each with its scope
// ("All vehicles · 2026-10-12") underneath.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

const speedText = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km/h`;

/** @param {object} data Parsed report (see parseSpeedReport) */
export default function SpeedSummaryCards({ data }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'max', icon: 'arrow-up-bold', color: colors.secondary, label: 'Max Speed', value: data.maxSpeed },
    { key: 'min', icon: 'arrow-down-bold', color: colors.statusOnline, label: 'Min Speed', value: data.minSpeed },
    { key: 'avg', icon: 'speedometer', color: colors.info, label: 'Average Speed', value: data.avgSpeed },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} style={styles.card}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Icon source={item.icon} size={22} color={item.color} />
            </View>
            <View style={styles.text}>
              <AppText variant="caption" color={item.color} style={styles.label}>
                {item.label}
              </AppText>
              <AppText variant="subtitle" style={styles.value}>
                {data.hasData ? speedText(item.value) : '-'}
              </AppText>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {data.scope}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { gap: spacing.sm },
  card: { padding: spacing.md, borderRadius: radius.lg },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  iconCircle: { width: 44, height: 44, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  label: { fontWeight: '700' },
  value: { fontWeight: '800' },
});
