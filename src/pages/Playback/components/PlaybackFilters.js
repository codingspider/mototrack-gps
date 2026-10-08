// Top of the Playback page: the vehicle and the chosen range (tap to change), then Today / Yesterday /
// Last 7 Days / Custom pills.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import VehicleIconBadge from '../../../components/vehicle/VehicleIconBadge';
import { PRESET_LABELS, PRESETS, describeRange } from '../../../utils/playbackRange';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { gap: spacing.sm, padding: spacing.sm, backgroundColor: colors.background },
    card: { padding: spacing.sm },
    cardRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    info: { flex: 1 },
    pills: { flexDirection: 'row', gap: spacing.sm },
    pill: { flex: 1, borderRadius: radius.round, backgroundColor: colors.border, overflow: 'hidden' },
    pillActive: { backgroundColor: colors.primary },
    pillContent: { alignItems: 'center', paddingVertical: spacing.sm },
    pillText: { fontWeight: '700', fontSize: 12 },
  });

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {string} preset Chosen pill: 'today' | 'yesterday' | 'week' | 'custom'
 * @param {object} range { fromDate, toDate, fromTime, toTime }
 * @param {function} onPreset Called with the pill the user taps (not 'custom')
 * @param {function} onCustom Opens the date and time picker
 */
export default function PlaybackFilters({ vehicle, preset, range, onPreset, onCustom }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.wrapper}>
      <Card style={styles.card} onPress={onCustom}>
        <View style={styles.cardRow}>
          <VehicleIconBadge vehicle={vehicle} size={40} />
          <View style={styles.info}>
            <AppText variant="subtitle" numberOfLines={1}>
              {vehicle.device_name}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {describeRange(range)}
            </AppText>
          </View>
          <Icon source="calendar-clock" size={22} color={colors.primary} />
        </View>
      </Card>
      <View style={styles.pills}>
        {PRESETS.map((item) => {
          const isActive = item === preset;
          const handlePress = item === 'custom' ? onCustom : () => onPreset(item);
          return (
            <TouchableRipple key={item} style={[styles.pill, isActive && styles.pillActive]} onPress={handlePress}>
              <View style={styles.pillContent}>
                <AppText color={isActive ? colors.textOnPrimary : colors.text} style={styles.pillText} numberOfLines={1}>
                  {PRESET_LABELS[item]}
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
      </View>
    </View>
  );
}
