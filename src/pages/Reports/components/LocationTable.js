// The Location Report Details table: Sl., Vehicle, Date, Time (Start), Time (End), Latitude, Longitude, Near By,
// Speed and a "View on Map" link that opens the point on a map inside the app. The table scrolls sideways.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'Sl.', 40, 'center'],
  ['vehicle', 'Vehicle', 136, 'left'],
  ['date', 'Date', 92, 'left'],
  ['start', 'Time (Start)', 92, 'center'],
  ['end', 'Time (End)', 92, 'center'],
  ['latitude', 'Latitude', 84, 'right'],
  ['longitude', 'Longitude', 84, 'right'],
  ['nearby', 'Near By', 260, 'left'],
  ['speed', 'Speed', 84, 'right'],
  ['map', 'Map', 100, 'center'],
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
    cell: { paddingVertical: spacing.sm, paddingHorizontal: spacing.sm, justifyContent: 'center' },
    mapLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseLocationReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Share the loaded rows as CSV
 * @param {function} onOpenMap Called with the row to show it on the map
 */
export default function LocationTable({ data, isLoadingMore, onLoadMore, onExport, onOpenMap }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  const textOf = (key, row, index) => {
    if (key === 'sl') {
      return String(index + 1);
    }
    if (key === 'latitude' || key === 'longitude') {
      return row[key] === null ? '-' : row[key].toFixed(6);
    }
    if (key === 'speed') {
      return `${row.speed.toFixed(2)} km/h`;
    }
    return row[key];
  };

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    if (key === 'map') {
      const canOpen = row.latitude !== null && row.longitude !== null;
      return (
        <View key={key} style={[styles.cell, { width }]}>
          {canOpen ? (
            <TouchableRipple borderless onPress={() => onOpenMap(row)}>
              <View style={styles.mapLink}>
                <Icon source="map-marker" size={14} color={colors.secondary} />
                <AppText variant="caption" color={colors.secondary} style={styles.title}>
                  View on Map
                </AppText>
              </View>
            </TouchableRipple>
          ) : (
            <AppText variant="caption" style={{ textAlign: align }}>-</AppText>
          )}
        </View>
      );
    }
    const isVehicle = key === 'vehicle';
    return (
      <View key={key} style={[styles.cell, { width }]}>
        <AppText
          variant="caption"
          color={isVehicle ? colors.secondary : undefined}
          style={[{ textAlign: align }, isVehicle && styles.title]}
        >
          {textOf(key, row, index)}
        </AppText>
      </View>
    );
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="map-marker-outline" size={22} color={colors.secondary} />
        <View style={styles.headerText}>
          <AppText variant="subtitle" style={styles.title}>
            Location Report Details
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
          {data.total === 0 ? 'No records' : `Showing ${data.rows.length} of ${data.total} records`}
        </AppText>
        {hasMore && <AppButton title="Load more" icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <AppButton title="Export CSV" icon="download" variant="secondary" isCompact onPress={onExport} />}
      </View>
    </Card>
  );
}
