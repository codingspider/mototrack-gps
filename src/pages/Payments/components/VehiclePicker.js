// Step 1 card: search, "Select all" and a checkbox row per vehicle with its expiry label.
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { Checkbox, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { getExpiryLabel } from '../../../utils/payments';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const LIST_HEIGHT = 300;

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md, borderRadius: radius.lg },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    selectAll: { flexDirection: 'row', alignItems: 'center' },
    search: {
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      color: colors.text,
      backgroundColor: colors.background,
    },
    list: { maxHeight: LIST_HEIGHT },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    name: { flex: 1 },
    label: { fontWeight: '700' },
  });

/**
 * @param {object[]} vehicles Vehicles from Redux
 * @param {object} expiryById { vehicleId: '2026-11-01' | null }
 * @param {number[]} selectedIds
 * @param {function} onChange Called with the new list of selected ids
 */
export default function VehiclePicker({ vehicles, expiryById, selectedIds, onChange }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [query, setQuery] = useState('');

  const visible = useMemo(() => {
    const text = query.trim().toLowerCase();
    if (!text) {
      return vehicles;
    }
    return vehicles.filter((vehicle) =>
      `${vehicle.device_name || ''} ${vehicle.plate_number || ''}`.toLowerCase().includes(text),
    );
  }, [vehicles, query]);

  const toneColors = {
    danger: colors.secondary,
    warning: colors.accent,
    success: colors.statusOnline,
    neutral: colors.textSecondary,
  };
  const areAllSelected = visible.length > 0 && visible.every((vehicle) => selectedIds.includes(vehicle.id));

  const toggle = (id) => {
    onChange(selectedIds.includes(id) ? selectedIds.filter((item) => item !== id) : [...selectedIds, id]);
  };

  const toggleAll = () => {
    const visibleIds = visible.map((vehicle) => vehicle.id);
    if (areAllSelected) {
      onChange(selectedIds.filter((id) => !visibleIds.includes(id)));
      return;
    }
    onChange([...new Set([...selectedIds, ...visibleIds])]);
  };

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <AppText variant="subtitle">1. Select vehicles</AppText>
        <TouchableRipple onPress={toggleAll}>
          <View style={styles.selectAll}>
            <Checkbox status={areAllSelected ? 'checked' : 'unchecked'} color={colors.primary} />
            <AppText variant="caption">Select all</AppText>
          </View>
        </TouchableRipple>
      </View>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder="Search by name or plate"
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
        autoCorrect={false}
      />
      {/* A plain ScrollView (not FlatList): a FlatList inside the page's ScrollView is not allowed by React Native */}
      <ScrollView style={styles.list} nestedScrollEnabled keyboardShouldPersistTaps="handled">
        {visible.length === 0 && <AppText color={colors.textSecondary}>No vehicles found</AppText>}
        {visible.map((item) => {
          const label = getExpiryLabel(expiryById[item.id]);
          return (
            <TouchableRipple key={item.id} onPress={() => toggle(item.id)}>
              <View style={styles.row}>
                <Checkbox status={selectedIds.includes(item.id) ? 'checked' : 'unchecked'} color={colors.primary} />
                <View style={styles.name}>
                  <AppText numberOfLines={1}>{item.device_name}</AppText>
                  <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                    {item.plate_number || 'No plate'}
                  </AppText>
                </View>
                <AppText variant="caption" color={toneColors[label.tone]} style={styles.label}>
                  {label.text}
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
      </ScrollView>
    </Card>
  );
}
