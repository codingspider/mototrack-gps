// Which alarm rules are account alarms, and which alerts are hidden by the switches.
import {
  getDisabledAlarmNames,
  isAboutDisabledAlarm,
  isAccountAlarm,
  isAlertHidden,
} from '../src/utils/alarmSettings';

const alarms = [
  { id: 257, name: 'Overspeed limit - Bogura NA 11-1516', type: 'overspeed', active: true, deviceCount: 1 },
  { id: 254, name: 'factory - Bogura NA 11-1516', type: 'geofence_out', active: true, deviceCount: 1 },
  { id: 176, name: 'Vehicle Power Disconnected', type: 'custom', active: true, deviceCount: 16 },
  { id: 175, name: 'GSM Jamming Alert', type: 'custom', active: false, deviceCount: 16 },
  { id: 100, name: 'Overspeed for all', type: 'overspeed', active: false, deviceCount: 5 },
];

describe('isAccountAlarm', () => {
  it('hides the per-vehicle overspeed and geofence rules', () => {
    expect(isAccountAlarm(alarms[0])).toBe(false);
    expect(isAccountAlarm(alarms[1])).toBe(false);
  });

  it('keeps the alarms that cover all vehicles', () => {
    expect(isAccountAlarm(alarms[2])).toBe(true);
    expect(isAccountAlarm(alarms[3])).toBe(true);
  });

  it('keeps an overspeed rule that covers several vehicles', () => {
    expect(isAccountAlarm(alarms[4])).toBe(true);
  });

  it('keeps a custom alarm even when the customer has one vehicle', () => {
    expect(isAccountAlarm({ type: 'custom', deviceCount: 1 })).toBe(true);
  });

  it('hides a vehicle rule whose vehicle count is unknown', () => {
    expect(isAccountAlarm({ type: 'overspeed', deviceCount: null })).toBe(false);
  });
});

describe('getDisabledAlarmNames', () => {
  it('lists only the switched-off account alarms, in lower case', () => {
    expect(getDisabledAlarmNames(alarms)).toEqual(['gsm jamming alert', 'overspeed for all']);
  });

  it('ignores very short names', () => {
    expect(getDisabledAlarmNames([{ name: 'SOS', type: 'custom', active: false, deviceCount: 3 }])).toEqual([]);
  });
});

describe('hiding alerts', () => {
  const disabled = ['gsm jamming alert'];

  it('matches an alert about a switched-off alarm, with a vehicle name in front', () => {
    expect(isAboutDisabledAlarm(['Bogura NA 11-1516 GSM Jamming Alert', ''], disabled)).toBe(true);
    expect(isAlertHidden({ title: 'GSM Jamming Alert' }, disabled)).toBe(true);
    expect(isAlertHidden({ title: 'x', message: 'Bogura GSM jamming alert!' }, disabled)).toBe(true);
  });

  it('keeps other alerts', () => {
    expect(isAlertHidden({ title: 'Ignition off', message: 'DM GA 32-4468' }, disabled)).toBe(false);
  });

  it('hides nothing when no alarm is switched off', () => {
    expect(isAlertHidden({ title: 'GSM Jamming Alert' }, [])).toBe(false);
    expect(isAlertHidden(null, disabled)).toBe(false);
  });
});

// ---- today's alerts and the unseen count: Bangladesh time texts ----
import { addSecondToText, bdNowText, bdTodayStartText, laterText } from '../src/utils/notifications';

describe('Bangladesh time texts for the alert filters', () => {
  // 2026-10-13 20:30:15 UTC is 14 Oct 02:30:15 in Bangladesh
  const nowMs = Date.UTC(2026, 9, 13, 20, 30, 15);

  it('writes now and the start of today in Bangladesh time', () => {
    expect(bdNowText(nowMs)).toBe('2026-10-14 02:30:15');
    expect(bdTodayStartText(nowMs)).toBe('2026-10-14 00:00:00');
  });

  it('adds one second', () => {
    expect(addSecondToText('2026-10-14 02:30:59')).toBe('2026-10-14 02:31:00');
  });

  it('picks the later text and ignores a missing one', () => {
    expect(laterText('2026-10-14 00:00:00', '2026-10-14 09:10:00')).toBe('2026-10-14 09:10:00');
    expect(laterText('2026-10-14 00:00:00', '2026-10-13 23:59:59')).toBe('2026-10-14 00:00:00');
    expect(laterText('2026-10-14 00:00:00', null)).toBe('2026-10-14 00:00:00');
    expect(laterText(null, '2026-10-14 00:00:00')).toBe('2026-10-14 00:00:00');
  });
});
