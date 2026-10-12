// The Daily Activity table: SL, Date, KM, Start Time, End Time, Duration, then "Showing 1-7 of 7 records".
// The columns keep their width and the table scrolls sideways on a narrow phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'SL', 40, 'center'],
  ['date', 'Date', 112, 'left'],
  ['km', 'KM', 76, 'right'],
  ['start', 'Start Time', 104, 'center'],
  ['end', 'End Time', 104, 'center'],
  ['duration', 'Duration', 90, 'center'],
];

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: 0, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    headerText: { flex: 1 },
    title: { fontWeight: '800' },
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
    km: { fontWeight: '800' },
    chip: { borderRadius: radius.sm, backgroundColor: colors.secondaryLight, paddingHorizontal: spacing.xs },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseDailyActivity)
 * @param {function} onExport Share the rows as CSV
 */
export default function DailyTable({ data, onExport }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    const base = [styles.cell, { width }];
    const textAlign = { textAlign: align };
    if (key === 'sl') {
      return (
        <View key={key} style={base}>
          <AppText variant="caption" style={textAlign}>{String(index + 1)}</AppText>
        </View>
      );
    }
    if (key === 'km') {
      return (
        <View key={key} style={base}>
          <AppText variant="caption" color={colors.secondary} style={[styles.km, textAlign]}>
            {row.km.toFixed(2)}
          </AppText>
        </View>
      );
    }
    if (key === 'duration') {
      return (
        <View key={key} style={[base, styles.chip]}>
          <AppText variant="caption" color={colors.secondary} style={[styles.km, textAlign]}>
            {row.duration}
          </AppText>
        </View>
      );
    }
    return (
      <View key={key} style={base}>
        <AppText variant="caption" style={textAlign}>{row[key]}</AppText>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="file-document-outline" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            Daily Activity
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
              {COLUMNS.map((column) => renderCell(column, row, index))}
            </View>
          ))}
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
