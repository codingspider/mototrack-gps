// The filter card at the top of a report: its fields (two per row when they are "half") and the Run report button.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppButton from '../../../components/common/AppButton';
import Card from '../../../components/common/Card';
import { monthOptions } from '../../../utils/reportFormat';
import { spacing } from '../../../theme';
import PickerField from './PickerField';
import SelectField from './SelectField';

const ALL_VEHICLES = { value: 'all', label: 'All vehicles' };

/** Put "half" fields side by side, "full" fields on their own row. */
function groupIntoRows(fields) {
  const rows = [];
  fields.forEach((field) => {
    const lastRow = rows[rows.length - 1];
    if (field.width === 'half' && lastRow && lastRow.length === 1 && lastRow[0].width === 'half') {
      lastRow.push(field);
      return;
    }
    rows.push([field]);
  });
  return rows;
}

/**
 * @param {Array} fields Filter definitions of the report
 * @param {object} filters Current values, by field key
 * @param {Array<{id, name}>} vehicles The customer's vehicles (for vehicle fields)
 * @param {function} onChange Called with (key, value)
 * @param {function} onRun Run the report
 * @param {boolean} isLoading The report is loading (button shows a spinner)
 */
export default function FilterCard({ fields, filters, vehicles, onChange, onRun, isLoading }) {
  const vehicleOptions = vehicles.map((vehicle) => ({ value: vehicle.id, label: vehicle.device_name }));

  const renderField = (field, isAlone) => {
    const value = filters[field.key];
    const handleChange = (next) => onChange(field.key, next);
    if (field.type === 'vehicle') {
      const options = field.allowAll ? [ALL_VEHICLES, ...vehicleOptions] : vehicleOptions;
      return <SelectField key={field.key} label={field.label} options={options} value={value} onChange={handleChange} isFull={isAlone} />;
    }
    if (field.type === 'month') {
      return <SelectField key={field.key} label={field.label} options={monthOptions()} value={value} onChange={handleChange} isFull={isAlone} />;
    }
    if (field.type === 'select') {
      return <SelectField key={field.key} label={field.label} options={field.options} value={value} onChange={handleChange} isFull={isAlone} />;
    }
    return <PickerField key={field.key} type={field.type} label={field.label} value={value} onChange={handleChange} />;
  };

  return (
    <Card style={styles.card}>
      {groupIntoRows(fields).map((row) => (
        <View key={row[0].key} style={styles.row}>
          {row.map((field) => renderField(field, row.length === 1))}
        </View>
      ))}
      <AppButton title="Run report" icon="magnify" onPress={onRun} isLoading={isLoading} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { gap: spacing.sm, padding: spacing.md },
  row: { flexDirection: 'row', gap: spacing.sm },
});
