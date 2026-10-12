// The Daily activity report helpers: time choices, quick buttons, the parsed answer and the CSV text.
import {
  TIME_OPTIONS,
  activePreset,
  buildDailyCsv,
  parseDailyActivity,
  presetFilters,
  sinceLabel,
} from '../src/utils/dailyActivity';

// 12 Oct 2026, 10:00 AM in Bangladesh
const NOW = Date.UTC(2026, 9, 12, 4, 0, 0);

describe('TIME_OPTIONS', () => {
  it('runs from 12:00 AM every 30 minutes to 11:30 PM, then 11:59 PM', () => {
    expect(TIME_OPTIONS[0]).toEqual({ value: '00:00', label: '12:00 AM' });
    expect(TIME_OPTIONS[1]).toEqual({ value: '00:30', label: '12:30 AM' });
    expect(TIME_OPTIONS[26]).toEqual({ value: '13:00', label: '01:00 PM' });
    expect(TIME_OPTIONS[TIME_OPTIONS.length - 2]).toEqual({ value: '23:30', label: '11:30 PM' });
    expect(TIME_OPTIONS[TIME_OPTIONS.length - 1]).toEqual({ value: '23:59', label: '11:59 PM' });
    expect(TIME_OPTIONS).toHaveLength(49);
  });
});

describe('activePreset', () => {
  it('knows the three quick buttons', () => {
    expect(activePreset(presetFilters('today', NOW), NOW)).toBe('today');
    expect(activePreset(presetFilters('yesterday', NOW), NOW)).toBe('yesterday');
    expect(activePreset(presetFilters('week', NOW), NOW)).toBe('week');
  });

  it('is custom for other dates or a part of the day', () => {
    const week = presetFilters('week', NOW);
    expect(activePreset({ ...week, fromDate: '2026-10-01' }, NOW)).toBe('custom');
    expect(activePreset({ ...week, fromTime: '08:00' }, NOW)).toBe('custom');
  });
});

describe('parseDailyActivity', () => {
  const answer = {
    status: 1,
    period: { days: 7 },
    total_km: 1872.65,
    generated_at: '12 Oct 2026 17:44',
    selected_device: { id: 5, name: 'Bogura LA 15-4717' },
    items: [
      { date: '06 Oct, 2026', date_raw: '2026-10-06', km: 44.17, start_time: '02:23:46 AM', end_time: '05:20:41 PM', duration_format: '14:56:55' },
    ],
    pagination: { total: 1, from: 1, to: 1 },
    distance_summary: { today_km: 40.8, total_km: 2334.04, total_since: '2026-09-26' },
  };

  it('keeps the totals and the rows', () => {
    const data = parseDailyActivity(answer);
    expect(data.vehicleName).toBe('Bogura LA 15-4717');
    expect(data.periodDays).toBe(7);
    expect(data.totalKm).toBe(1872.65);
    expect(data.todayKm).toBe(40.8);
    expect(data.sinceKm).toBe(2334.04);
    expect(data.sinceDate).toBe('2026-09-26');
    expect(data.rows[0]).toEqual({
      key: '2026-10-06',
      date: '06 Oct, 2026',
      km: 44.17,
      start: '02:23:46 AM',
      end: '05:20:41 PM',
      duration: '14:56:55',
    });
    expect(data.total).toBe(1);
  });

  it('copes with a vehicle that has no totals', () => {
    const data = parseDailyActivity({ status: 1, items: [], distance_summary: null });
    expect(data.todayKm).toBe(0);
    expect(data.rows).toEqual([]);
    expect(data.total).toBe(0);
  });
});

describe('buildDailyCsv and sinceLabel', () => {
  it('writes one line per day with the serial number', () => {
    const csv = buildDailyCsv('Bogura', [
      { date: '06 Oct, 2026', km: 44.1, start: '02:23:46 AM', end: '05:20:41 PM', duration: '14:56:55' },
    ]);
    expect(csv.split('\n')).toEqual([
      'Bogura',
      'SL,Date,KM,Start Time,End Time,Duration',
      '1,"06 Oct, 2026",44.10,02:23:46 AM,05:20:41 PM,14:56:55',
    ]);
  });

  it('formats the install date', () => {
    expect(sinceLabel('2026-09-26')).toBe('26 Sep 2026');
    expect(sinceLabel('')).toBe('');
  });
});
