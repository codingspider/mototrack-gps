// Filters of the Daily activity report, like the web page: quick buttons (Today, Yesterday, Last 7 Days, Custom),
// vehicle, start and end date, start and end time, then Apply Filters and Reset.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { PRESET_LABELS } from '../../../utils/playbackRange';
import { TIME_OPTIONS } from '../../../utils/dailyActivity';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import PickerField from './PickerField';
import SelectField from './SelectField';

const PRESET_ICONS = {
  today: 'calendar-today',
  yesterday: 'calendar-arrow-left',
  week: 'calendar-week',
  custom: 'calendar-edit',
};
const PRESET_NAMES = ['today', 'yesterday', 'week', 'custom'];

const makeStyles = colors =>
  StyleSheet.create({
    card: { gap: spacing.sm, padding: spacing.md },
    presets: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
    preset: {
      flexGrow: 1,
      flexBasis: '45%',
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
    presetActive: {
      backgroundColor: colors.primary,
      borderColor: colors.primary,
    },
    presetText: { fontWeight: '700' },
    row: { flexDirection: 'row', gap: spacing.sm },
    search: { height: 48 },
    actions: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.xs },
    actionMain: { flex: 2 },
    actionReset: { flex: 1 },
  });

/**
 * @param {{ vehicleId, fromDate, toDate, fromTime, toTime }} filters
 * @param {Array<{id, device_name}>} vehicles
 * @param {string} activeKey Which quick button is on: today | yesterday | week | custom
 * @param {function} onPreset Called with the quick button name
 * @param {function} onChange Called with (key, value)
 * @param {function} onApply
 * @param {function} onReset
 * @param {boolean} isLoading
 * @param {boolean} allowAllVehicles Adds an "All vehicles" choice (value 0), for the overview report
 * @param {function} onSearch Optional: shows a search box (vehicle name or plate); called with the text. Its text is filters.search
 * @param {Array<{value, label}>} timeRangeOptions Optional: one "Time" choice (filters.timeRange) instead of start and end time
 * @param {boolean} showTimes false hides the time choices (a report that works on whole days)
 * @param {boolean} hasMinDistance Shows a "Min distance (KM)" box (filters.minDistance, text)
 * @param {[string, string]} dateLabels Titles of the two date boxes
 * @param {Array<{value, label}>} statusOptions Optional: shows one more choice (filters.status), e.g. Status or Alert type
 * @param {string} statusLabel Title of that choice
 */
export default function DailyFilters({
  filters,
  vehicles,
  activeKey,
  onPreset,
  onChange,
  onApply,
  onReset,
  isLoading,
  allowAllVehicles = false,
  onSearch,
  timeRangeOptions,
  showTimes = true,
  hasMinDistance = false,
  dateLabels = ['Start date', 'End date'],
  statusOptions,
  statusLabel = 'Status',
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicleOptions = vehicles.map(vehicle => ({
    value: vehicle.id,
    label: vehicle.device_name,
  }));
  if (allowAllVehicles) {
    vehicleOptions.unshift({ value: 0, label: 'All vehicles' });
  }

  return (
    <Card style={styles.card}>
      <View style={styles.presets}>
        {PRESET_NAMES.map(name => {
          const isActive = name === activeKey;
          const color = isActive ? colors.textOnPrimary : colors.text;
          return (
            <TouchableRipple
              key={name}
              borderless
              style={[styles.preset, isActive && styles.presetActive]}
              onPress={() => onPreset(name)}
            >
              <>
                <Icon
                  source={PRESET_ICONS[name]}
                  size={16}
                  color={isActive ? colors.textOnPrimary : colors.primary}
                />
                <AppText
                  variant="caption"
                  color={color}
                  style={styles.presetText}
                >
                  {PRESET_LABELS[name]}
                </AppText>
              </>
            </TouchableRipple>
          );
        })}
      </View>

      <View style={styles.row}>
        <SelectField
          label="Vehicle"
          options={vehicleOptions}
          value={filters.vehicleId}
          onChange={value => onChange('vehicleId', value)}
          isFull
        />
      </View>
      {!!onSearch && (
        <AppInput
          placeholder="Search vehicle or device"
          icon="magnify"
          value={filters.search || ''}
          onChangeText={onSearch}
          returnKeyType="search"
          onSubmitEditing={onApply}
          style={styles.search}
        />
      )}
      <View style={styles.row}>
        <PickerField
          type="date"
          label={dateLabels[0]}
          value={filters.fromDate}
          onChange={value => onChange('fromDate', value)}
        />
        <PickerField
          type="date"
          label={dateLabels[1]}
          value={filters.toDate}
          onChange={value => onChange('toDate', value)}
        />
      </View>
      {!!statusOptions && (
        <View style={styles.row}>
          <SelectField
            label={statusLabel}
            options={statusOptions}
            value={filters.status}
            onChange={value => onChange('status', value)}
            isFull
          />
        </View>
      )}
      {hasMinDistance && (
        <AppInput
          placeholder="Min distance (KM), e.g. 0"
          icon="road-variant"
          value={filters.minDistance}
          onChangeText={text =>
            onChange('minDistance', text.replace(/[^0-9.]/g, ''))
          }
          keyboardType="decimal-pad"
          returnKeyType="search"
          onSubmitEditing={onApply}
          style={styles.search}
        />
      )}
      {(showTimes || timeRangeOptions) && (
        <View style={styles.row}>
          {timeRangeOptions ? (
            <SelectField
              label="Time"
              options={timeRangeOptions}
              value={filters.timeRange}
              onChange={value => onChange('timeRange', value)}
              isFull
            />
          ) : (
            <>
              <SelectField
                label="Start time"
                options={TIME_OPTIONS}
                value={filters.fromTime}
                onChange={value => onChange('fromTime', value)}
              />
              <SelectField
                label="End time"
                options={TIME_OPTIONS}
                value={filters.toTime}
                onChange={value => onChange('toTime', value)}
              />
            </>
          )}
        </View>
      )}

      <View style={styles.actions}>
        <AppButton
          title="Apply Filters"
          icon="magnify"
          onPress={onApply}
          isLoading={isLoading}
          style={styles.actionMain}
        />
        <AppButton
          title="Reset"
          icon="refresh"
          variant="secondary"
          onPress={onReset}
          isDisabled={isLoading}
          style={styles.actionReset}
        />
      </View>
    </Card>
  );
}
