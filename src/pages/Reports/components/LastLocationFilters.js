// Filters of the Last location report, like the web page: quick buttons (All, Today, Yesterday, Last 7 Days, Custom),
// the From and To date (for Custom), vehicle and a search box, then Generate Report and Reset.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { RANGES } from '../../../utils/lastLocationReport';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import PickerField from './PickerField';
import SelectField from './SelectField';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    preset: {
      flexGrow: 1,
      flexBasis: '30%',
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      borderWidth: 1.5,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    presetActive: { backgroundColor: colors.primary, borderColor: colors.primary },
    presetText: { fontWeight: '700' },
    row: { flexDirection: 'row', gap: spacing.sm },
    search: { height: 48 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    actionMain: { flex: 2 },
    actionReset: { flex: 1 },
  });

/**
 * @param {{ range, fromDate, toDate, vehicleId, search }} filters
 * @param {Array<{id, device_name}>} vehicles
 * @param {function} onRange Called with the quick button key
 * @param {function} onChange Called with (key, value)
 * @param {function} onApply
 * @param {function} onReset
 * @param {boolean} isLoading
 */
export default function LastLocationFilters({ filters, vehicles, onRange, onChange, onApply, onReset, isLoading }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicleOptions = [{ value: 0, label: 'All vehicles' }].concat(
    vehicles.map((vehicle) => ({ value: vehicle.id, label: vehicle.device_name })),
  );

  return (
    <Card style={styles.card}>
      <View style={styles.presets}>
        {RANGES.map((range) => {
          const isActive = range.key === filters.range;
          return (
            <TouchableRipple
              key={range.key}
              borderless
              style={[styles.preset, isActive && styles.presetActive]}
              onPress={() => onRange(range.key)}
            >
              <>
                <Icon source={range.icon} size={16} color={isActive ? colors.textOnPrimary : colors.primary} />
                <AppText variant="caption" color={isActive ? colors.textOnPrimary : colors.text} style={styles.presetText}>
                  {range.label}
                </AppText>
              </>
            </TouchableRipple>
          );
        })}
      </View>

      {filters.range === 'custom' && (
        <View style={styles.row}>
          <PickerField type="date" label="From date" value={filters.fromDate} onChange={(value) => onChange('fromDate', value)} />
          <PickerField type="date" label="To date" value={filters.toDate} onChange={(value) => onChange('toDate', value)} />
        </View>
      )}

      <View style={styles.row}>
        <SelectField label="Vehicle" options={vehicleOptions} value={filters.vehicleId} onChange={(value) => onChange('vehicleId', value)} isFull />
      </View>
      <AppInput
        placeholder="Search vehicles"
        icon="magnify"
        value={filters.search}
        onChangeText={(text) => onChange('search', text)}
        returnKeyType="search"
        onSubmitEditing={onApply}
        style={styles.search}
      />

      <View style={styles.actions}>
        <AppButton title="Generate Report" icon="magnify" onPress={onApply} isLoading={isLoading} style={styles.actionMain} />
        <AppButton title="Reset" icon="refresh" variant="secondary" onPress={onReset} isDisabled={isLoading} style={styles.actionReset} />
      </View>
    </Card>
  );
}
