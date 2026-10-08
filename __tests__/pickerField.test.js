import React from 'react';
import renderer, { act } from 'react-test-renderer';
import PickerField from '../src/pages/Reports/components/PickerField';

jest.mock('react-native-paper-dates', () => ({
  DatePickerModal: () => null,
  TimePickerModal: () => null,
  en: {},
  registerTranslation: () => {},
}));
jest.mock('../src/pages/Reports/components/FieldBox', () => {
  const { Text } = require('react-native');
  return ({ label, text }) => <Text>{`${label}: ${text}`}</Text>;
});

// Every kind of field must draw with its own kind of value (a date field has no time part)
const render = (props) => {
  let tree;
  act(() => {
    tree = renderer.create(<PickerField onChange={() => {}} {...props} />);
  });
  return JSON.stringify(tree.toJSON());
};

describe('PickerField', () => {
  it('draws a date field', () => {
    expect(render({ type: 'date', label: 'Date', value: '2026-10-08' })).toContain('Date: 08 Oct 2026');
  });
  it('draws a date and time field', () => {
    expect(render({ type: 'dateTime', label: 'From', value: '2026-10-02 00:00' })).toContain('From: 02 Oct, 12:00 AM');
  });
  it('draws a time range field', () => {
    expect(render({ type: 'timeRange', label: 'Time', value: { from: '00:00', to: '23:59' } })).toContain('Time: 12:00 AM – 11:59 PM');
  });
});
