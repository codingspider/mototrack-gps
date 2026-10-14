// The Trip Report Details table: SL, Start Time, Stop Time, Duration, Distance (km), Speed (km/h), From and To.
// The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import ExportButtons from './ExportButtons';
import { useTranslation } from '../../../i18n/LanguageContext';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'SL', 40, 'center'],
  ['start', 'Start Time', 150, 'left'],
  ['end', 'Stop Time', 150, 'left'],
  ['duration', 'Duration', 90, 'center'],
  ['distance', 'Distance (km)', 100, 'right'],
  ['speed', 'Speed (km/h)', 100, 'right'],
  ['from', 'From', 260, 'left'],
  ['to', 'To', 260, 'left'],
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
    chip: {
      alignSelf: 'center',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
      backgroundColor: colors.secondaryLight,
    },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseTripReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Called with 'pdf', 'xlsx' or 'csv'
 * @param {string} busyFormat The file being made now ('' when none)
 */
export default function TripTable({ data, isLoadingMore, onLoadMore, onExport, busyFormat }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    const base = [styles.cell, { width }];

    if (key === 'duration') {
      return (
        <View key={key} style={base}>
          <View style={styles.chip}>
            <AppText variant="caption" color={colors.secondary} style={styles.title}>
              {row.duration}
            </AppText>
          </View>
        </View>
      );
    }

    let text;
    if (key === 'sl') {
      text = String(index + 1);
    } else if (key === 'distance') {
      text = row.distance.toFixed(2);
    } else if (key === 'speed') {
      text = row.speed.toFixed(2);
    } else {
      text = String(row[key]);
    }
    const isDistance = key === 'distance';
    return (
      <View key={key} style={base}>
        <AppText
          variant="caption"
          color={isDistance ? colors.secondary : undefined}
          style={[{ textAlign: align }, isDistance && styles.title]}
        >
          {text}
        </AppText>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="format-list-bulleted" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title} numberOfLines={2}>
            {data.vehicleName ? t('Trip Report Details — {name}', { name: data.vehicleName }) : t('Trip Report Details')}
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
              {COLUMNS.map((column) => renderCell(column, row, index))}
            </View>
          ))}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <AppText variant="caption" color={colors.textSecondary}>
          {data.total === 0 ? t('No records') : t('Showing {shown} of {total} trips', { shown: data.rows.length, total: data.total })}
        </AppText>
        {hasMore && <AppButton title={t('Load more')} icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <ExportButtons onExport={onExport} busyFormat={busyFormat} />}
      </View>
    </Card>
  );
}
