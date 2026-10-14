// The Engine Report Details table: Sl., Vehicle, Status (On / Off / Idle badge), From, To and Duration.
// The table scrolls sideways on a narrow phone.
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
  ['sl', 'Sl.', 40, 'center'],
  ['vehicle', 'Vehicle', 170, 'left'],
  ['status', 'Status', 80, 'center'],
  ['from', 'From', 190, 'left'],
  ['to', 'To', 190, 'left'],
  ['duration', 'Duration', 90, 'center'],
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
    badge: {
      alignSelf: 'center',
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.round,
    },
    badgeText: { fontWeight: '800' },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseEngineReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Called with 'pdf', 'xlsx' or 'csv'
 * @param {string} busyFormat The file being made now ('' when none)
 */
export default function EngineTable({ data, isLoadingMore, onLoadMore, onExport, busyFormat }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  // On is green, Idle amber, Off red (like the web badges)
  const toneOf = (status) => {
    if (status === 'On') {
      return colors.statusOnline;
    }
    if (status === 'Idle') {
      return colors.accent;
    }
    return colors.secondary;
  };

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    const base = [styles.cell, { width }];

    if (key === 'status') {
      const tone = toneOf(row.status);
      return (
        <View key={key} style={base}>
          <View style={[styles.badge, { backgroundColor: `${tone}22` }]}>
            <Icon source="power" size={12} color={tone} />
            <AppText variant="caption" color={tone} style={styles.badgeText}>
              {row.status}
            </AppText>
          </View>
        </View>
      );
    }

    const isVehicle = key === 'vehicle';
    return (
      <View key={key} style={base}>
        <AppText
          variant="caption"
          color={isVehicle ? colors.secondary : undefined}
          style={[{ textAlign: align }, isVehicle && styles.title]}
        >
          {key === 'sl' ? String(index + 1) : row[key]}
        </AppText>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="engine" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            {t('Engine Report Details')}
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
          {data.total === 0 ? t('No records') : t('Showing {shown} of {total} records', { shown: data.rows.length, total: data.total })}
        </AppText>
        {hasMore && <AppButton title={t('Load more')} icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <ExportButtons onExport={onExport} busyFormat={busyFormat} />}
      </View>
    </Card>
  );
}
