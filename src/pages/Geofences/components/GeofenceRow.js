// One geofence of a vehicle: color dot, name, shape, when it alerts, and the edit / delete buttons.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { getZoneText } from '../../../utils/geofence';
import { GEOFENCE_COLORS, radius, spacing, useAppTheme } from '../../../theme';

/**
 * @param {object} item Row from joinVehicleGeofences: { id, name, type, color, zone, isActive }
 * @param {function} onEdit Called with the geofence id
 * @param {function} onDelete Called with the row
 */
function GeofenceRow({ item, onEdit, onDelete }) {
  const { colors } = useAppTheme();
  const shape = item.type === 'circle' ? 'Circle' : 'Area';

  return (
    <Card style={styles.card}>
      <View style={styles.content}>
        <View style={[styles.dot, { backgroundColor: item.color || GEOFENCE_COLORS[0] }]} />
        <View style={styles.info}>
          <AppText variant="subtitle" numberOfLines={1}>
            {item.name}
          </AppText>
          <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
            {`${shape} · ${getZoneText(item.zone)}`}
          </AppText>
          {!item.isActive && (
            <AppText variant="caption" color={colors.accent}>
              Alert is switched off
            </AppText>
          )}
        </View>
        <IconButton icon="pencil-outline" iconColor={colors.primary} size={22} onPress={() => onEdit(item.id)} accessibilityLabel="Edit geofence" />
        <IconButton icon="trash-can-outline" iconColor={colors.secondary} size={22} onPress={() => onDelete(item)} accessibilityLabel="Delete geofence" />
      </View>
    </Card>
  );
}

export default React.memo(GeofenceRow);

const styles = StyleSheet.create({
  card: { marginBottom: spacing.sm, padding: spacing.sm, paddingLeft: spacing.md },
  content: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  dot: { width: 16, height: 16, borderRadius: radius.round },
  info: { flex: 1 },
});
