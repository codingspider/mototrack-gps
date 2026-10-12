// The Vehicle Last Location Report table: Sl., Vehicle, Customer (Subadmin), Model, Chassis No., Installation,
// Last Status (ONLINE / OFFLINE badge), Last Location Time, Nearby Landmark and a "View on Map" button.
// The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'Sl.', 40, 'center'],
  ['vehicle', 'Vehicle', 150, 'left'],
  ['customer', 'Customer (Subadmin)', 190, 'left'],
  ['model', 'Model', 80, 'left'],
  ['chassis', 'Chassis No.', 110, 'left'],
  ['installation', 'Installation', 100, 'left'],
  ['status', 'Last Status', 100, 'center'],
  ['lastTime', 'Last Location Time', 150, 'left'],
  ['nearby', 'Nearby Landmark', 260, 'left'],
  ['action', 'Action', 120, 'center'],
];

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: 0, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, padding: spacing.md },
    headerText: { flex: 1 },
    title: { fontWeight: '800' },
    headRow: { flexDirection: 'row', backgroundColor: colors.primaryLight },
    row: { flexDirection: 'row', borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: colors.border },
    cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, justifyContent: 'center' },
    badge: { alignSelf: 'center', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.sm },
    badgeText: { fontWeight: '800' },
    mapButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs, paddingVertical: spacing.xs, borderRadius: radius.sm, backgroundColor: colors.secondary },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseLastLocationReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Share the loaded rows as CSV
 * @param {function} onOpenMap Called with the row to show it on the map
 */
export default function LastLocationTable({ data, isLoadingMore, onLoadMore, onExport, onOpenMap }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    const base = [styles.cell, { width }];

    if (key === 'status') {
      const color = row.isOnline ? colors.statusOnline : colors.statusOffline;
      return (
        <View key={key} style={base}>
          <View style={[styles.badge, { backgroundColor: color }]}>
            <AppText variant="caption" color={colors.textOnPrimary} style={styles.badgeText}>
              {row.status}
            </AppText>
          </View>
        </View>
      );
    }

    if (key === 'action') {
      const canOpen = row.latitude !== null && row.longitude !== null;
      return (
        <View key={key} style={base}>
          {canOpen ? (
            <TouchableRipple borderless style={styles.mapButton} onPress={() => onOpenMap(row)}>
              <>
                <Icon source="map-marker" size={14} color={colors.textOnPrimary} />
                <AppText variant="caption" color={colors.textOnPrimary} style={styles.badgeText}>
                  View on Map
                </AppText>
              </>
            </TouchableRipple>
          ) : (
            <AppText variant="caption" style={{ textAlign: align }}>-</AppText>
          )}
        </View>
      );
    }

    const text = key === 'sl' ? String(index + 1) : row[key];
    return (
      <View key={key} style={base}>
        <AppText variant="caption" style={{ textAlign: align }}>
          {text}
        </AppText>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="crosshairs-gps" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            Vehicle Last Location Report
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
          {data.total === 0 ? 'No records' : `Showing ${data.rows.length} of ${data.total} vehicles`}
        </AppText>
        {hasMore && <AppButton title="Load more" icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <AppButton title="Export CSV" icon="download" variant="secondary" isCompact onPress={onExport} />}
      </View>
    </Card>
  );
}
