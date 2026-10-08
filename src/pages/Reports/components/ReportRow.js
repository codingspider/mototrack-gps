// One result row: colored badge (time or day), title and details on the left, the main number on the right,
// and an optional little bar. Tap it when the row has an action (open the map, play the trip back).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { getToneColors } from '../reportTones';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: spacing.md, borderRadius: radius.lg },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    badge: { width: 56, height: 56, borderRadius: radius.md, alignItems: 'center', justifyContent: 'center' },
    badgeTop: { fontWeight: '800' },
    badgeBottom: { fontWeight: '700', fontSize: 11 },
    middle: { flex: 1 },
    title: { fontWeight: '800' },
    right: { alignItems: 'flex-end', maxWidth: 110 },
    value: { fontWeight: '800' },
    track: { height: 5, borderRadius: radius.round, backgroundColor: colors.border, marginTop: spacing.sm, overflow: 'hidden' },
    fill: { height: 5, borderRadius: radius.round },
  });

/**
 * @param {object} row { badge: { top, bottom }, tone, title, subtitle, value, valueSub, valueTone, progress, action }
 * @param {function} onPress Called when the row has an action and is tapped
 */
export default function ReportRow({ row, onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = getToneColors(row.tone, colors);
  const valueColor = row.valueTone ? getToneColors(row.valueTone, colors).fg : colors.text;

  return (
    <Card style={styles.card} onPress={row.action ? onPress : undefined}>
      <View style={styles.row}>
        <View style={[styles.badge, { backgroundColor: tone.bg }]}>
          <AppText color={tone.fg} style={styles.badgeTop} adjustsFontSizeToFit numberOfLines={1}>
            {row.badge.top}
          </AppText>
          {!!row.badge.bottom && (
            <AppText color={tone.fg} style={styles.badgeBottom}>
              {row.badge.bottom}
            </AppText>
          )}
        </View>
        <View style={styles.middle}>
          <AppText style={styles.title} numberOfLines={1}>
            {row.title}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {row.subtitle}
          </AppText>
          {row.progress !== undefined && (
            <View style={styles.track}>
              <View style={[styles.fill, { width: `${Math.round(row.progress * 100)}%`, backgroundColor: tone.fg }]} />
            </View>
          )}
        </View>
        {!!row.value && (
          <View style={styles.right}>
            <AppText color={valueColor} style={styles.value} numberOfLines={1}>
              {row.value}
            </AppText>
            {!!row.valueSub && (
              <AppText variant="caption" color={row.valueTone ? valueColor : colors.textSecondary} numberOfLines={1}>
                {row.valueSub}
              </AppText>
            )}
          </View>
        )}
      </View>
    </Card>
  );
}
