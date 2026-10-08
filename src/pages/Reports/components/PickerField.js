// Date / date + time / time range field, using the Paper date and time pickers one step after another.
import React, { useState } from 'react';
import dayjs from 'dayjs';
import { DatePickerModal, TimePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import { dateToText, timeToText } from '../../../utils/playbackRange';
import { clock12 } from '../../../utils/reportFormat';
import FieldBox from './FieldBox';

registerTranslation('en', en);

const splitTime = (text) => text.split(':').map(Number);

/** The text shown inside the field for each kind of value. */
function describe(type, value) {
  if (type === 'date') {
    return dayjs(value).format('DD MMM YYYY');
  }
  if (type === 'dateTime') {
    return `${dayjs(value.slice(0, 10)).format('DD MMM')}, ${clock12(value.slice(11))}`;
  }
  return `${clock12(value.from)} – ${clock12(value.to)}`;
}

/**
 * @param {'date'|'dateTime'|'timeRange'} type
 *   date: 'YYYY-MM-DD' | dateTime: 'YYYY-MM-DD HH:mm' | timeRange: { from: 'HH:mm', to: 'HH:mm' }
 * @param {string} label
 * @param {*} value Current value (shape depends on type)
 * @param {function} onChange Called with a value of the same shape
 */
export default function PickerField({ type, label, value, onChange }) {
  const [step, setStep] = useState(null); // null | 'date' | 'time' | 'timeTo'
  const [pickedDate, setPickedDate] = useState('');
  const [pickedFrom, setPickedFrom] = useState('00:00');

  const open = () => setStep(type === 'timeRange' ? 'time' : 'date');
  const close = () => setStep(null);

  // The time pickers start from the current value; a date-only field has no time, so it uses midnight
  const startText = { dateTime: () => value.slice(11), timeRange: () => value.from }[type]?.() || '00:00';
  const endText = type === 'timeRange' ? value.to : '23:59';
  const [startHours, startMinutes] = splitTime(startText);
  const [endHours, endMinutes] = splitTime(endText);

  const handleDate = ({ date }) => {
    const text = dateToText(date);
    if (type === 'date') {
      close();
      onChange(text);
      return;
    }
    setPickedDate(text);
    setStep('time');
  };

  const handleTime = (time) => {
    if (type === 'dateTime') {
      close();
      onChange(`${pickedDate} ${timeToText(time)}`);
      return;
    }
    setPickedFrom(timeToText(time));
    setStep('timeTo');
  };

  const handleTimeTo = (time) => {
    close();
    onChange({ from: pickedFrom, to: timeToText(time) });
  };

  return (
    <>
      <FieldBox label={label} text={describe(type, value)} onPress={open} />
      {step === 'date' && (
        <DatePickerModal
          locale="en"
          mode="single"
          visible
          date={new Date(`${type === 'date' ? value : value.slice(0, 10)}T00:00:00`)}
          validRange={{ endDate: new Date() }}
          saveLabel={type === 'date' ? 'Save' : 'Next'}
          onDismiss={close}
          onConfirm={handleDate}
        />
      )}
      {step === 'time' && (
        <TimePickerModal
          locale="en"
          visible
          label={type === 'timeRange' ? 'Start time' : 'Time'}
          hours={startHours}
          minutes={startMinutes}
          onDismiss={close}
          onConfirm={handleTime}
        />
      )}
      {step === 'timeTo' && (
        <TimePickerModal locale="en" visible label="End time" hours={endHours} minutes={endMinutes} onDismiss={close} onConfirm={handleTimeTo} />
      )}
    </>
  );
}
