// The player panel: status, clock and speed, start / end, progress line, play buttons, speed pills, skip stops.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, Switch, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { SPEEDS } from '../../../hooks/usePlayback';
import { formatBdTime } from '../../../utils/formatDate';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import ProgressBar from './ProgressBar';

const makeStyles = (colors) =>
  StyleSheet.create({
    panel: { gap: spacing.md },
    topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    status: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: radius.round },
    statusText: { fontWeight: '800', letterSpacing: 0.5 },
    clock: { flex: 1 },
    speedChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.round,
      backgroundColor: colors.primarySoft,
    },
    endsRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    endItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    dot: { width: 12, height: 12, borderRadius: radius.round, borderWidth: 3 },
    controls: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    sideButton: { margin: 0, backgroundColor: colors.border },
    playButton: { margin: 0, backgroundColor: colors.primary, elevation: 6, shadowColor: colors.primary },
    jumpWrap: { alignItems: 'center' },
    speedRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    speedPill: { borderRadius: radius.md, backgroundColor: colors.border, overflow: 'hidden' },
    speedPillActive: { backgroundColor: colors.primary },
    speedPillContent: { paddingHorizontal: spacing.lg, paddingVertical: spacing.sm },
    skip: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'flex-end', gap: spacing.sm },
  });

/**
 * @param {object} player Result of usePlayback
 * @param {number} playTime Current moment (unix seconds)
 * @param {number} currentSpeed Vehicle speed at this moment, km/h
 * @param {number} startTime First moment of the trip
 * @param {number} endTime Last moment of the trip
 * @param {function} onDownload Download the playback video
 */
export default function PlaybackControls({ player, playTime, currentSpeed, startTime, endTime, onDownload }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  let statusText = 'PAUSED';
  let statusColor = colors.primary;
  let statusBackground = colors.primarySoft;
  if (player.isPlaying) {
    statusText = 'PLAYING';
    statusColor = colors.statusMoving;
    statusBackground = colors.statusOnlineSoft;
  } else if (player.hasEnded) {
    statusText = 'ENDED';
    statusColor = colors.textSecondary;
    statusBackground = colors.border;
  }

  return (
    <View style={styles.panel}>
      <View style={styles.topRow}>
        <View style={[styles.status, { backgroundColor: statusBackground }]}>
          <AppText variant="caption" color={statusColor} style={styles.statusText}>
            {statusText}
          </AppText>
        </View>
        <AppText variant="title" style={styles.clock}>
          {formatBdTime(playTime)}
        </AppText>
        <View style={styles.speedChip}>
          <Icon source="speedometer" size={16} color={colors.primary} />
          <AppText color={colors.primary} style={styles.statusText}>
            {Math.round(currentSpeed)} km/h
          </AppText>
        </View>
      </View>

      <View style={styles.endsRow}>
        <View style={styles.endItem}>
          <View style={[styles.dot, { borderColor: colors.statusMoving }]} />
          <AppText variant="caption" color={colors.textSecondary}>
            Start
          </AppText>
          <AppText style={styles.statusText}>{formatBdTime(startTime)}</AppText>
        </View>
        <View style={styles.endItem}>
          <AppText variant="caption" color={colors.textSecondary}>
            End
          </AppText>
          <AppText style={styles.statusText}>{formatBdTime(endTime)}</AppText>
          <View style={[styles.dot, { borderColor: colors.secondary }]} />
        </View>
      </View>

      <ProgressBar share={player.share} onSeek={player.seek} />

      <View style={styles.controls}>
        <IconButton icon="restart" size={24} iconColor={colors.text} style={styles.sideButton} onPress={player.restart} accessibilityLabel="Play again from the start" />
        <View style={styles.jumpWrap}>
          <IconButton icon="rewind-10" size={26} iconColor={colors.text} style={styles.sideButton} onPress={() => player.jump(-1)} accessibilityLabel="Back 10 seconds" />
        </View>
        <IconButton
          icon={player.isPlaying ? 'pause' : 'play'}
          size={44}
          iconColor={colors.textOnPrimary}
          style={styles.playButton}
          onPress={player.toggle}
          accessibilityLabel={player.isPlaying ? 'Pause' : 'Play'}
        />
        <View style={styles.jumpWrap}>
          <IconButton icon="fast-forward-10" size={26} iconColor={colors.text} style={styles.sideButton} onPress={() => player.jump(1)} accessibilityLabel="Forward 10 seconds" />
        </View>
        <IconButton icon="download" size={24} iconColor={colors.text} style={styles.sideButton} onPress={onDownload} accessibilityLabel="Download playback video" />
      </View>

      <View style={styles.speedRow}>
        {SPEEDS.map((value) => {
          const isActive = value === player.speed;
          return (
            <TouchableRipple key={value} style={[styles.speedPill, isActive && styles.speedPillActive]} onPress={() => player.setSpeed(value)}>
              <View style={styles.speedPillContent}>
                <AppText color={isActive ? colors.textOnPrimary : colors.textSecondary} style={styles.statusText}>
                  {value}x
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
        <View style={styles.skip}>
          <AppText color={colors.textSecondary}>Skip Stops</AppText>
          <Switch value={player.isSkippingStops} onValueChange={player.setIsSkippingStops} color={colors.primary} />
        </View>
      </View>
    </View>
  );
}
