// Journey Timeline: trip started, each parking and restart, trip ended, with times and where each one happened.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import useAddress from '../../../hooks/useAddress';
import { formatBdTime } from '../../../utils/formatDate';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const COLLAPSED_COUNT = 4;
const DOT_SIZE = 30;

const makeStyles = (colors) =>
  StyleSheet.create({
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    row: { flexDirection: 'row', gap: spacing.md },
    rail: { alignItems: 'center', width: DOT_SIZE },
    dot: { width: DOT_SIZE, height: DOT_SIZE, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    line: { flex: 1, width: 2, backgroundColor: colors.border, marginVertical: 2 },
    text: { flex: 1, paddingBottom: spacing.md },
    time: { fontWeight: '600' },
    title: { fontWeight: '800' },
  });

/** The address of one timeline entry, looked up once per place (shared through Redux with the rest of the app). */
function PlaceAddress({ latitude, longitude }) {
  const { colors } = useAppTheme();
  const address = useAddress('', latitude, longitude);
  const text = address || 'Looking up the address…';
  return (
    <View style={placeStyles.row}>
      <Icon source="map-marker-outline" size={14} color={colors.textSecondary} />
      <AppText variant="caption" color={colors.textSecondary} style={placeStyles.text} numberOfLines={2}>
        {text}
      </AppText>
    </View>
  );
}

const placeStyles = StyleSheet.create({
  row: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.xs, marginTop: 2 },
  text: { flex: 1 },
});

/**
 * @param {Array} items Result of buildTimeline
 */
export default function JourneyTimeline({ items }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [isExpanded, setIsExpanded] = useState(false);

  const looks = {
    start: { icon: 'flag-variant', color: colors.statusMoving },
    park: { icon: 'alpha-p', color: colors.accent },
    resume: { icon: 'play', color: colors.statusMoving },
    end: { icon: 'stop', color: colors.secondary },
  };
  const shown = isExpanded ? items : items.slice(0, COLLAPSED_COUNT);

  return (
    <View>
      <View style={styles.titleRow}>
        <AppText variant="subtitle">Journey Timeline</AppText>
        {items.length > COLLAPSED_COUNT && (
          <AppButton title={isExpanded ? 'Show less' : 'View all'} variant="link" isCompact onPress={() => setIsExpanded(!isExpanded)} />
        )}
      </View>
      {shown.map((item, index) => {
        const look = looks[item.type];
        const isLast = index === shown.length - 1;
        return (
          <View key={item.key} style={styles.row}>
            <View style={styles.rail}>
              <View style={[styles.dot, { backgroundColor: look.color }]}>
                <Icon source={look.icon} size={18} color={colors.textOnPrimary} />
              </View>
              {!isLast && <View style={styles.line} />}
            </View>
            <View style={styles.text}>
              <View style={styles.titleRow}>
                <AppText style={styles.title}>{item.title}</AppText>
                <AppText color={colors.textSecondary} style={styles.time}>
                  {formatBdTime(item.time)}
                </AppText>
              </View>
              {!!item.detail && (
                <AppText variant="caption" color={colors.textSecondary}>
                  {item.detail}
                </AppText>
              )}
              <PlaceAddress latitude={item.latitude} longitude={item.longitude} />
            </View>
          </View>
        );
      })}
    </View>
  );
}
