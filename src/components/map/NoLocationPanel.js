// Shown instead of the map when a vehicle has no position yet: the tracker is connected but has never found a GPS
// fix (it only sends 0,0 marked invalid), or it has not reported at all. Says why and what to check.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../common/AppText';
import { useTranslation } from '../../i18n/LanguageContext';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import { formatTimeAgo } from '../../utils/formatDate';
import { getStatusGroup } from '../../utils/vehicleStatus';

const makeStyles = (colors) =>
  StyleSheet.create({
    container: { alignItems: 'center', justifyContent: 'center', padding: spacing.xl, gap: spacing.sm },
    iconCircle: {
      width: 64,
      height: 64,
      borderRadius: radius.round,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
    },
    text: { textAlign: 'center' },
  });

/**
 * @param {object} vehicle Vehicle from Redux
 * @param {number} height Height of the area the map would take
 */
export default function NoLocationPanel({ vehicle, height }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const isOffline = getStatusGroup(vehicle?.status) === 'offline';
  const lastReport = formatTimeAgo(vehicle?.last_position_stamp, Date.now(), t);

  return (
    <View style={[styles.container, { height }]}>
      <View style={styles.iconCircle}>
        <Icon source="crosshairs-question" size={32} color={colors.primary} />
      </View>
      <AppText variant="subtitle" style={styles.text}>
        {isOffline ? t('No location yet') : t('Waiting for GPS signal')}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
        {isOffline
          ? t('This tracker has not sent a position yet.')
          : t(
              'The tracker is connected but has not found its position. Check that the GPS antenna is connected and not covered, or park the vehicle in the open.',
            )}
      </AppText>
      {vehicle?.last_position_stamp ? (
        <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
          {t('Last report: {time}', { time: lastReport })}
        </AppText>
      ) : null}
    </View>
  );
}
