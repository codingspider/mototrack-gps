// The Hourly Report Details table: Sl., Date, Distance (km), Hour Start, Hour End, Max Speed, Min Speed, and a Total
// row at the bottom. The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';
import ExportButtons from './ExportButtons';
import { useTranslation } from '../../../i18n/LanguageContext';

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
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      padding: spacing.md,
    },
    headerText: { flex: 1 },
    title: { fontWeight: '800' },
    right: { textAlign: 'right' },
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    footRow: {
      flexDirection: 'row',
      backgroundColor: colors.primaryLight,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    cell: {
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.sm,
      justifyContent: 'center',
    },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseHourlyReport)
 * @param {function} onExport Called with 'pdf', 'xlsx' or 'csv'
 * @param {string} busyFormat The file being made now ('' when none)
 */
export default function HourlyTable({ data, onExport, busyFormat }) {
  const { t } = useTranslation();
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
            {t('Hourly Report Details')}
          </AppText>
          {!!data.generatedAt && (
            <AppText variant="caption" color={colors.textSecondary}>
              {t('Generated on: {time}', { time: data.generatedAt })}
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
                  {t(title)}
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
                {t('Total')}
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
          {data.total === 0 ? t('No records') : t('Showing {from}–{to} of {total} records', { from: data.from, to: data.to, total: data.total })}
        </AppText>
        {data.rows.length > 0 && <ExportButtons onExport={onExport} busyFormat={busyFormat} />}
      </View>
    </Card>
  );
}
