// The four summary boxes of the Engine report: total engine on, total engine off, total idle time, total events.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';

/** @param {object} data Parsed report (see parseEngineReport) */
export default function EngineSummaryCards({ data }) {
  const { colors } = useAppTheme();
  const items = [
    { key: 'on', icon: 'engine', color: colors.secondary, label: 'Total Engine On', value: data.engineOn, note: '(hh:mm:ss)' },
    { key: 'off', icon: 'power', color: colors.statusOnline, label: 'Total Engine Off', value: data.engineOff, note: '(hh:mm:ss)' },
    { key: 'idle', icon: 'clock-outline', color: colors.info, label: 'Total Idle Time', value: data.idle, note: '(hh:mm:ss)' },
    { key: 'events', icon: 'car', color: colors.accent, label: 'Total Events', value: String(data.events), note: '(On/Off Events)' },
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
