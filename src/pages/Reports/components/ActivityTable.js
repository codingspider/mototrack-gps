// The Vehicle Activity Details table: Sl., Vehicle, Customer, VRN, Start Time, End Time, Duration, Distance,
// Overspeed, Trips, Trip Duration and Earliest Landmark. The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';
import ExportButtons from './ExportButtons';
import { useTranslation } from '../../../i18n/LanguageContext';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'Sl.', 40, 'center'],
  ['vehicle', 'Vehicle', 150, 'left'],
  ['customer', 'Customer', 190, 'left'],
  ['vrn', 'VRN', 130, 'left'],
  ['start', 'Start Time', 120, 'left'],
  ['end', 'End Time', 120, 'left'],
  ['duration', 'Duration', 90, 'center'],
  ['distance', 'Distance', 96, 'right'],
  ['overspeed', 'Overspeed', 90, 'center'],
  ['trips', 'Trips', 60, 'center'],
  ['tripDuration', 'Trip Duration', 110, 'right'],
  ['landmark', 'Earliest Landmark', 260, 'left'],
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
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: {
      flexDirection: 'row',
      borderTopWidth: StyleSheet.hairlineWidth,
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
 * @param {object} data Parsed report (see parseActivityReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Called with 'pdf', 'xlsx' or 'csv'
 * @param {string} busyFormat The file being made now ('' when none)
 */
export default function ActivityTable({ data, isLoadingMore, onLoadMore, onExport, busyFormat }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="clipboard-text-outline" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            {t('Vehicle Activity Details')}
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
              {COLUMNS.map(([key, , width, align]) => {
                const isVehicle = key === 'vehicle';
                const text = key === 'sl' ? String(index + 1) : String(row[key]);
                return (
                  <View key={key} style={[styles.cell, { width }]}>
                    <AppText
                      variant="caption"
                      color={isVehicle ? colors.secondary : undefined}
                      style={[{ textAlign: align }, isVehicle && styles.title]}
                    >
                      {text}
                    </AppText>
                  </View>
                );
              })}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textSecondary}>
          {data.total === 0 ? t(t(t('No records'))) : t('Showing {shown} of {total} vehicles', { shown: data.rows.length, total: data.total })}
        </AppText>
        {hasMore && <AppButton title={t('Load more')} icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <ExportButtons onExport={onExport} busyFormat={busyFormat} />}
      </View>
    </Card>
  );
}
