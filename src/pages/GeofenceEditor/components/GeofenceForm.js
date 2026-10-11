// The form under the map: name, when to alert (leaves / enters / both), color, and the Save button.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import AppText from '../../../components/common/AppText';
import { GEOFENCE_ZONES, getZoneText } from '../../../utils/geofence';
import { GEOFENCE_COLORS, radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    form: { backgroundColor: colors.surface },
    content: { padding: spacing.md, gap: spacing.sm },
    row: { flexDirection: 'row', gap: spacing.sm },
    zone: { flex: 1, alignItems: 'center', paddingVertical: spacing.sm, borderRadius: radius.md, borderWidth: 1, borderColor: colors.border },
    zoneActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    colorRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
    color: { width: 34, height: 34, borderRadius: radius.round, borderWidth: 3, borderColor: colors.surface },
    colorActive: { borderColor: colors.text },
  });

/**
 * @param {string} name
 * @param {string} zone 'in' | 'out' | 'both'
 * @param {string} color Hex color
 * @param {boolean} isSaving
 * @param {boolean} isEditing Changes the button text
 * @param {function} onChangeName
 * @param {function} onChangeZone
 * @param {function} onChangeColor
 * @param {function} onSave
 */
export default function GeofenceForm({
  name,
  zone,
  color,
  isSaving,
  isEditing,
  onChangeName,
  onChangeZone,
  onChangeColor,
  onSave,
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <ScrollView style={styles.form} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
      <AppInput label="Geofence name" value={name} onChangeText={onChangeName} autoCapitalize="words" />
      <AppText variant="caption" color={colors.textSecondary}>
        Alert me when the vehicle
      </AppText>
      <View style={styles.row}>
        {GEOFENCE_ZONES.map((item) => {
          const isSelected = item.key === zone;
          return (
            <TouchableRipple
              key={item.key}
              onPress={() => onChangeZone(item.key)}
              style={[styles.zone, isSelected && styles.zoneActive]}
            >
              <AppText color={isSelected ? colors.textOnPrimary : colors.text}>{item.label}</AppText>
            </TouchableRipple>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.textSecondary}>
        {getZoneText(zone)}
      </AppText>
      <AppText variant="caption" color={colors.textSecondary}>
        Color
      </AppText>
      <View style={styles.colorRow}>
        {GEOFENCE_COLORS.map((item) => (
          <TouchableRipple
            key={item}
            borderless
            onPress={() => onChangeColor(item)}
            style={[styles.color, { backgroundColor: item }, item === color && styles.colorActive]}
          >
            <View />
          </TouchableRipple>
        ))}
      </View>
      <AppButton title={isEditing ? 'Save changes' : 'Save geofence'} isLoading={isSaving} onPress={onSave} />
    </ScrollView>
  );
}
