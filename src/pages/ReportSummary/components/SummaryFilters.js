// Under the title: the vehicle dropdown, then the range chips (Today / Yesterday / Last 7 days) and the date.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Chip, Icon, Menu, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { SUMMARY_PRESETS } from '../../../utils/reportSummary';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { gap: spacing.sm },
    selectRipple: { borderRadius: radius.md },
    select: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.surface,
    },
    selectText: { flex: 1 },
    chips: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
    date: { marginLeft: 'auto' },
  });

/**
 * @param {object[]} vehicles Vehicles from Redux
 * @param {number} vehicleId Selected vehicle
 * @param {function} onSelectVehicle Called with a vehicle id
 * @param {string} preset 'today' | 'yesterday' | 'week'
 * @param {function} onSelectPreset
 * @param {string} dateText e.g. "11 Oct 2026"
 */
export default function SummaryFilters({ vehicles, vehicleId, onSelectVehicle, preset, onSelectPreset, dateText }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const selected = vehicles.find((vehicle) => vehicle.id === vehicleId);

  return (
    <View style={styles.wrapper}>
      <Menu
        visible={isMenuOpen}
        onDismiss={() => setIsMenuOpen(false)}
        anchorPosition="bottom"
        anchor={
          <TouchableRipple borderless style={styles.selectRipple} onPress={() => setIsMenuOpen(true)}>
            <View style={styles.select}>
              <Icon source="car-side" size={22} color={colors.primary} />
              <AppText style={styles.selectText} numberOfLines={1}>
                {selected ? selected.device_name : 'Choose a vehicle'}
              </AppText>
              <Icon source="chevron-down" size={22} color={colors.textSecondary} />
            </View>
          </TouchableRipple>
        }
      >
        {vehicles.map((vehicle) => (
          <Menu.Item
            key={vehicle.id}
            title={vehicle.device_name}
            onPress={() => {
              setIsMenuOpen(false);
              onSelectVehicle(vehicle.id);
            }}
          />
        ))}
      </Menu>
      <View style={styles.chips}>
        {SUMMARY_PRESETS.map((item) => {
          const isSelected = item.key === preset;
          return (
            <Chip
              key={item.key}
              selected={isSelected}
              showSelectedCheck={false}
              onPress={() => onSelectPreset(item.key)}
              style={{ backgroundColor: isSelected ? colors.primary : colors.surface }}
              textStyle={{ color: isSelected ? colors.textOnPrimary : colors.text }}
            >
              {item.label}
            </Chip>
          );
        })}
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.date}>
        {dateText}
      </AppText>
    </View>
  );
}
