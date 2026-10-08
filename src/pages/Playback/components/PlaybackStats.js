// Four number cards: distance, driving time, parking time, average speed.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { formatDuration } from '../../../utils/playbackStats';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', gap: spacing.sm },
    card: {
      flex: 1,
      alignItems: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    value: { fontWeight: '800' },
  });

/** @param {object} summary Result of summarizeTrip */
export default function PlaybackStats({ summary }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const cards = [
    { key: 'distance', icon: 'map-marker-distance', color: colors.primary, value: `${summary.distanceKm.toFixed(1)} km`, label: 'Distance' },
    { key: 'driving', icon: 'car', color: colors.statusMoving, value: formatDuration(summary.drivingSeconds), label: 'Driving' },
    { key: 'parking', icon: 'car-brake-parking', color: colors.secondary, value: formatDuration(summary.parkingSeconds), label: 'Parking' },
    { key: 'avg', icon: 'speedometer', color: colors.accent, value: `${Math.round(summary.avgSpeedKmh)} km/h`, label: 'Avg. Speed' },
  ];

  return (
    <View style={styles.row}>
      {cards.map((card) => (
        <View key={card.key} style={styles.card}>
          <Icon source={card.icon} size={22} color={card.color} />
          <AppText style={styles.value} numberOfLines={1} adjustsFontSizeToFit>
            {card.value}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {card.label}
          </AppText>
        </View>
      ))}
    </View>
  );
}
