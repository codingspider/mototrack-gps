// The Fuel Alert Details table: SL, Date & Time, Vehicle, Plate, Alert (badge), Amount (L), Speed (km/h), Location
// and a "View on Map" link that opens the point on a map inside the app. The table scrolls sideways on a phone.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { litresText } from '../../../utils/fuelAlertReport';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

// [key, title, width, align]
const COLUMNS = [
  ['sl', 'SL', 40, 'center'],
  ['time', 'Date & Time', 150, 'left'],
  ['vehicle', 'Vehicle', 150, 'left'],
  ['plate', 'Plate', 110, 'left'],
  ['alert', 'Alert', 150, 'left'],
  ['amount', 'Amount (L)', 96, 'right'],
  ['speed', 'Speed (km/h)', 100, 'right'],
  ['address', 'Location', 260, 'left'],
  ['map', 'Map', 100, 'center'],
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
    badge: { alignSelf: 'flex-start', paddingHorizontal: spacing.sm, paddingVertical: 2, borderRadius: radius.round },
    badgeText: { fontWeight: '800' },
    mapLink: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.xs },
    footer: { padding: spacing.md, gap: spacing.sm },
  });

/**
 * @param {object} data Parsed report (see parseFuelAlertReport)
 * @param {boolean} isLoadingMore The next page is coming
 * @param {function} onLoadMore
 * @param {function} onExport Share the loaded rows as CSV
 * @param {function} onOpenMap Called with the row to show it on the map
 */
export default function FuelAlertTable({ data, isLoadingMore, onLoadMore, onExport, onOpenMap }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tableWidth = COLUMNS.reduce((total, column) => total + column[2], 0);
  const hasMore = data.page < data.lastPage;

  // Filling is green, theft / drop red, anything else amber
  const toneOf = (type) => {
    if (type === 'fuel_fill') {
      return colors.statusOnline;
    }
    if (type === 'fuel_theft') {
      return colors.secondary;
    }
    return colors.accent;
  };

  const renderCell = (column, row, index) => {
    const [key, , width, align] = column;
    const base = [styles.cell, { width }];

    if (key === 'alert') {
      const tone = toneOf(row.type);
      return (
        <View key={key} style={base}>
          <View style={[styles.badge, { backgroundColor: `${tone}22` }]}>
            <AppText variant="caption" color={tone} style={styles.badgeText} numberOfLines={2}>
              {row.alert}
            </AppText>
          </View>
        </View>
      );
    }

    if (key === 'map') {
      const canOpen = row.latitude !== null && row.longitude !== null;
      return (
        <View key={key} style={base}>
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

    let text;
    if (key === 'sl') {
      text = String(index + 1);
    } else if (key === 'amount') {
      text = litresText(row.amount);
    } else if (key === 'speed') {
      text = row.speed.toFixed(1);
    } else {
      text = String(row[key]);
    }
    const isVehicle = key === 'vehicle';
    return (
      <View key={key} style={base}>
        <AppText
          variant="caption"
          color={isVehicle ? colors.secondary : undefined}
          style={[{ textAlign: align }, isVehicle && styles.title]}
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
          <AppText variant="subtitle" style={styles.title}>
            Fuel Alert Details
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
          {data.total === 0 ? 'No records' : `Showing ${data.rows.length} of ${data.total} alerts`}
        </AppText>
        {hasMore && <AppButton title="Load more" icon="chevron-down" isCompact isLoading={isLoadingMore} onPress={onLoadMore} />}
        {data.rows.length > 0 && <AppButton title="Export CSV" icon="download" variant="secondary" isCompact onPress={onExport} />}
      </View>
    </Card>
  );
}
