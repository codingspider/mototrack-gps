// One alert: a colored icon for its type, the title, the vehicle and when it happened (Bangladesh time).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { formatAlertTime, getAlertStyle, getAlertTitle } from '../../../utils/notifications';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { marginBottom: spacing.sm, padding: spacing.md },
    content: { flexDirection: 'row', gap: spacing.md },
    iconCircle: { width: 40, height: 40, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 2 },
    title: { fontWeight: '700' },
    meta: { color: colors.textSecondary },
  });

/**
 * @param {object} item One alert from GET /notifications
 * @param {function} onPress Called with the vehicle id (when the alert has a vehicle)
 */
function AlertRow({ item, onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const alertStyle = getAlertStyle(item.type);
  const toneColors = { danger: colors.secondary, warning: colors.accent, info: colors.info, success: colors.statusOnline };
  const color = toneColors[alertStyle.tone];
  const vehicleId = item.device ? item.device.id : null;
  const vehicleName = item.device ? item.device.name : '';

  return (
    <Card style={styles.card} onPress={vehicleId ? () => onPress(vehicleId) : undefined}>
      <View style={styles.content}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
          <Icon source={alertStyle.icon} size={22} color={color} />
        </View>
        <View style={styles.info}>
          <AppText style={styles.title} numberOfLines={2}>
            {getAlertTitle(item)}
          </AppText>
          {!!item.message && item.message !== item.title && (
            <AppText variant="caption" style={styles.meta} numberOfLines={2}>
              {item.message}
            </AppText>
          )}
          <AppText variant="caption" style={styles.meta} numberOfLines={1}>
            {[vehicleName, formatAlertTime(item.time)].filter(Boolean).join(' · ')}
          </AppText>
          {!!item.address && (
            <AppText variant="caption" style={styles.meta} numberOfLines={1}>
              {item.address}
            </AppText>
          )}
        </View>
      </View>
    </Card>
  );
}

export default React.memo(AlertRow);
