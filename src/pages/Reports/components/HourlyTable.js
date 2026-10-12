// The Hourly Report Details table: Sl., Date, Distance (km), Hour Start, Hour End, Max Speed, Min Speed, and a Total
// row at the bottom. The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'Sl.', 40, 'center'],
  ['date', 'Date', 104, 'left'],
  ['km', 'Distance (km)', 108, 'right'],
  ['start', 'Hour Start', 90, 'center'],
  ['end', 'Hour End', 90, 'center'],
  ['max', 'Max Speed (km/h)', 124, 'right'],
  ['min', 'Min Speed (km/h)', 124, 'right'],
];

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: 0, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    headerText: { flex: 1 },
    title: { fontWeight: '800' },
    right: { textAlign: 'right' },
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    footRow: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderTopWidth: 1, borderTopColor: colors.border },
    cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, justifyContent: 'center' },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseHourlyReport)
 * @param {function} onExport Share the table as CSV
 */
export default function HourlyTable({ data, onExport }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);

  const textOf = (key, row, index) => {
    if (key === 'sl') {
      return String(index + 1);
    }
    if (key === 'km' || key === 'max' || key === 'min') {
      return row[key].toFixed(2);
    }
    return row[key];
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="clock-outline" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            Hourly Report Details
          </AppText>
          {!!data.generatedAt && (
            <AppText variant="caption" color={colors.textSecondary}>
              {`Generated on: ${data.generatedAt}`}
            </AppText>
          )}
        </View>
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <View style={{ width: tableWidth }}>
          <View style={styles.headRow}>
            {COLUMNS.map(([key, title, width, align]) => (
              <View key={key} style={[styles.cell, { width }]}>
                <AppText variant="caption" style={[styles.title, { textAlign: align }]}>
                  {title}
                </AppText>
              </View>
            ))}
          </View>

          {data.rows.map((row, index) => (
            <View key={row.key} style={styles.row}>
              {COLUMNS.map(([key, , width, align]) => (
                <View key={key} style={[styles.cell, { width }]}>
                  <AppText variant="caption" style={{ textAlign: align }}>
                    {textOf(key, row, index)}
                  </AppText>
                </View>
              ))}
            </View>
          ))}

          <View style={styles.footRow}>
            <View style={[styles.cell, { width: COLUMNS[0][2] + COLUMNS[1][2] }]}>
              <AppText variant="caption" style={styles.title}>
                Total
              </AppText>
            </View>
            <View style={[styles.cell, { width: COLUMNS[2][2] }]}>
              <AppText variant="caption" color={colors.secondary} style={[styles.title, styles.right]}>
                {data.totalKm.toFixed(2)}
              </AppText>
            </View>
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textSecondary}>
          {data.total === 0 ? 'No records' : `Showing ${data.from}–${data.to} of ${data.total} records`}
        </AppText>
        {data.rows.length > 0 && <AppButton title="Export CSV" icon="download" variant="secondary" isCompact onPress={onExport} />}
      </View>
    </Card>
  );
}
