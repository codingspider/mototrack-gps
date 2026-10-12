// The Monthly Distance Overview table: SL, Vehicle, Plate Number, Total (km), then one column for every day of the
// period, and a Total row at the bottom. The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { kmCell } from '../../../utils/monthlyOverview';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

const SL_WIDTH = 40;
const VEHICLE_WIDTH = 150;
const PLATE_WIDTH = 120;
const TOTAL_WIDTH = 92;
const DATE_WIDTH = 76;

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: 0, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    headerText: { flex: 1 },
    title: { fontWeight: '800' },
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    footRow: { flexDirection: 'row', backgroundColor: colors.primaryLight, borderTopWidth: 1, borderTopColor: colors.border },
    cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, justifyContent: 'center' },
    strong: { fontWeight: '800' },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseMonthlyOverview)
 * @param {function} onExport Share the table as CSV
 */
export default function MonthlyTable({ data, onExport }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = SL_WIDTH + VEHICLE_WIDTH + PLATE_WIDTH + TOTAL_WIDTH + DATE_WIDTH * data.dates.length;

  const cell = (width, content, extra) => (
    <View style={[styles.cell, { width }]}>
      <AppText variant="caption" numberOfLines={1} {...extra}>
        {content}
      </AppText>
    </View>
  );

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="file-document-outline" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            Monthly Distance Overview
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
            {cell(SL_WIDTH, 'SL', { style: [styles.strong, { textAlign: 'center' }] })}
            {cell(VEHICLE_WIDTH, 'Vehicle', { style: styles.strong })}
            {cell(PLATE_WIDTH, 'Plate Number', { style: styles.strong })}
            {cell(TOTAL_WIDTH, `Total (${data.unit})`, { style: [styles.strong, { textAlign: 'right' }], color: colors.secondary })}
            {data.dates.map((date) => (
              <React.Fragment key={date.key}>{cell(DATE_WIDTH, date.label, { style: [styles.strong, { textAlign: 'right' }] })}</React.Fragment>
            ))}
          </View>

          {data.rows.map((row, index) => (
            <View key={row.key} style={styles.row}>
              {cell(SL_WIDTH, String(index + 1), { style: { textAlign: 'center' } })}
              {cell(VEHICLE_WIDTH, row.name, { style: styles.strong, color: colors.secondary })}
              {cell(PLATE_WIDTH, row.plate)}
              {cell(TOTAL_WIDTH, row.total.toFixed(2), { style: [styles.strong, { textAlign: 'right' }], color: colors.secondary })}
              {data.dates.map((date) => (
                <React.Fragment key={date.key}>
                  {cell(DATE_WIDTH, kmCell(row.byDate[date.key]), { style: { textAlign: 'right' } })}
                </React.Fragment>
              ))}
            </View>
          ))}

          <View style={styles.footRow}>
            {cell(SL_WIDTH, '')}
            {cell(VEHICLE_WIDTH + PLATE_WIDTH, 'Total', { style: styles.strong })}
            {cell(TOTAL_WIDTH, data.fleetTotal.toFixed(2), { style: [styles.strong, { textAlign: 'right' }], color: colors.secondary })}
            {data.dateTotals.map((value, index) => (
              <React.Fragment key={data.dates[index].key}>
                {cell(DATE_WIDTH, kmCell(value), { style: [styles.strong, { textAlign: 'right' }] })}
              </React.Fragment>
            ))}
          </View>
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textSecondary}>
          {data.total === 0 ? 'No vehicles' : `Showing ${data.from}–${data.to} of ${data.total} vehicles`}
        </AppText>
        {data.rows.length > 0 && <AppButton title="Export CSV" icon="download" variant="secondary" isCompact onPress={onExport} />}
      </View>
    </Card>
  );
}
