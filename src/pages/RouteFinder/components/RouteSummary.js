// The card under the map: time and distance of the chosen route, traffic, and the other routes to choose from.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Chip, Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { formatArrival, formatDistance, formatDuration } from '../../../utils/directions';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
    top: { flexDirection: 'row', alignItems: 'baseline', gap: spacing.md },
    time: { fontSize: 28, lineHeight: 34, fontWeight: '800' },
    distance: { fontSize: 18, fontWeight: '700' },
    trafficRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    facts: { flexDirection: 'row', gap: spacing.lg },
    chips: { flexDirection: 'row', gap: spacing.sm },
  });

/**
 * @param {object[]} routes Parsed routes (utils/directions.js parseDirections)
 * @param {number} selectedIndex
 * @param {function} onSelect Called with a route index
 * @param {number|null} straightLine Meters in a straight line from start to end
 */
export default function RouteSummary({ routes, selectedIndex, onSelect, straightLine }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const route = routes[selectedIndex];
  const trafficColors = {
    light: colors.statusOnline,
    moderate: colors.accent,
    heavy: colors.secondary,
    unknown: colors.textSecondary,
  };

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        <AppText style={styles.time}>{formatDuration(route.durationSeconds)}</AppText>
        <AppText style={styles.distance}>{formatDistance(route.distanceMeters)}</AppText>
      </View>
      <View style={styles.trafficRow}>
        <Icon source="traffic-light" size={18} color={trafficColors[route.traffic.level]} />
        <AppText variant="caption" color={trafficColors[route.traffic.level]}>
          {route.traffic.text}
        </AppText>
      </View>
      <View style={styles.facts}>
        <AppText variant="caption" color={colors.textSecondary}>
          {`Arrive ${formatArrival(route.durationSeconds)}`}
        </AppText>
        {route.trafficSeconds !== null && (
          <AppText variant="caption" color={colors.textSecondary}>
            {`No traffic ${formatDuration(route.normalSeconds)}`}
          </AppText>
        )}
        {straightLine !== null && (
          <AppText variant="caption" color={colors.textSecondary}>
            {`Straight line ${formatDistance(straightLine)}`}
          </AppText>
        )}
      </View>
      {routes.length > 1 && (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chips}>
          {routes.map((item, index) => {
            const isSelected = index === selectedIndex;
            return (
              <Chip
                key={item.id}
                selected={isSelected}
                showSelectedCheck={false}
                onPress={() => onSelect(index)}
                style={{ backgroundColor: isSelected ? colors.primary : colors.background }}
                textStyle={{ color: isSelected ? colors.textOnPrimary : colors.text }}
              >
                {`${item.summary ? `via ${item.summary} · ` : ''}${formatDuration(item.durationSeconds)}`}
              </Chip>
            );
          })}
        </ScrollView>
      )}
    </Card>
  );
}
