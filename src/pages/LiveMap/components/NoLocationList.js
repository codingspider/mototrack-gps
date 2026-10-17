// On the Live map: the vehicles of the chosen filter that have no position yet (no GPS fix), so they are not
// silently missing. A small pill shows how many; tapping it lists them, and tapping one opens its details.
import React, { useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { useTranslation } from '../../../i18n/LanguageContext';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const MAX_LIST_HEIGHT = 220;

const makeStyles = (colors) =>
  StyleSheet.create({
    wrap: { alignItems: 'flex-start', gap: spacing.xs },
    pill: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.warning,
    },
    list: {
      maxHeight: MAX_LIST_HEIGHT,
      minWidth: 220,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
    },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    name: { flex: 1 },
  });

/**
 * @param {object[]} vehicles Vehicles without a position
 * @param {function} onOpen Called with the vehicle id
 */
export default function NoLocationList({ vehicles, onOpen }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [isOpen, setIsOpen] = useState(false);

  if (vehicles.length === 0) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      <Pressable style={styles.pill} onPress={() => setIsOpen((value) => !value)}>
        <Icon source="crosshairs-question" size={16} color={colors.warning} />
        <AppText variant="caption">{t('{n} without GPS location', { n: vehicles.length })}</AppText>
        <Icon source={isOpen ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textSecondary} />
      </Pressable>
      {isOpen && (
        <ScrollView style={styles.list}>
          {vehicles.map((vehicle) => (
            <Pressable key={vehicle.id} style={styles.row} onPress={() => onOpen(vehicle.id)}>
              <AppText style={styles.name} numberOfLines={1}>
                {vehicle.plate_number || vehicle.device_name}
              </AppText>
              <Icon source="chevron-right" size={18} color={colors.textSecondary} />
            </Pressable>
          ))}
        </ScrollView>
      )}
    </View>
  );
}
