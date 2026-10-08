// Custom range: pick the dates, then the start time, then the end time. Calls onConfirm with the finished range.
import React, { useState } from 'react';
import { DatePickerModal, TimePickerModal, en, registerTranslation } from 'react-native-paper-dates';
import { dateToText, timeToText } from '../../../utils/playbackRange';

registerTranslation('en', en);

/**
 * @param {boolean} visible Show the picker (starts at the dates)
 * @param {object} range The range now in use (the pickers start from it)
 * @param {function} onConfirm Called with { fromDate, toDate, fromTime, toTime }
 * @param {function} onDismiss Called when the user backs out at any step
 */
export default function RangePicker({ visible, range, onConfirm, onDismiss }) {
  const [step, setStep] = useState('dates'); // 'dates' | 'fromTime' | 'toTime'
  const [picked, setPicked] = useState(range);

  const [fromHours, fromMinutes] = (picked.fromTime || '00:00').split(':').map(Number);
  const [toHours, toMinutes] = (picked.toTime || '23:59').split(':').map(Number);

  const close = () => {
    setStep('dates');
    onDismiss();
  };

  if (!visible) {
    return null;
  }

  return (
    <>
      <DatePickerModal
        locale="en"
        mode="range"
        visible={step === 'dates'}
        onDismiss={close}
        startDate={new Date(`${range.fromDate}T00:00:00`)}
        endDate={new Date(`${range.toDate}T00:00:00`)}
        validRange={{ endDate: new Date() }}
        saveLabel="Next"
        onConfirm={({ startDate, endDate }) => {
          if (!startDate || !endDate) {
            return;
          }
          setPicked({ ...range, fromDate: dateToText(startDate), toDate: dateToText(endDate) });
          setStep('fromTime');
        }}
      />
      <TimePickerModal
        locale="en"
        visible={step === 'fromTime'}
        label="Start time"
        hours={fromHours}
        minutes={fromMinutes}
        onDismiss={close}
        onConfirm={(time) => {
          setPicked((current) => ({ ...current, fromTime: timeToText(time) }));
          setStep('toTime');
        }}
      />
      <TimePickerModal
        locale="en"
        visible={step === 'toTime'}
        label="End time"
        hours={toHours}
        minutes={toMinutes}
        onDismiss={close}
        onConfirm={(time) => {
          setStep('dates');
          onConfirm({ ...picked, toTime: timeToText(time) });
        }}
      />
    </>
  );
}
