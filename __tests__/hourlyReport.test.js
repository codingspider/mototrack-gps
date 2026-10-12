// The Hourly report helpers: the time choices, the parsed answer and the CSV text.
import { HOUR_RANGES, buildHourlyCsv, parseHourlyReport } from '../src/utils/hourlyReport';

const answer = {
  status: 1,
  sum_km: 17.62,
  devices_count: 16,
  generated_at: '12 Oct 2026 17:46',
  items: [
    { hour: '2026-10-12 00:00:00', date: '2026-10-12', km: 16.03, hour_start: '00:00', hour_end: '01:00', max_speed: 51, min_speed: 0 },
    { hour: '2026-10-12 01:00:00', date: '2026-10-12', km: 1.59, hour_start: '01:00', hour_end: '02:00', max_speed: 41, min_speed: 0 },
  ],
  summary: { vehicles: 16, distance: 17.62, avg_hourly: 8.81, operating: '00:00 - 23:59', max_speed: 51 },
  pagination: { total: 2, from: 1, to: 2 },
};

describe('HOUR_RANGES', () => {
  it('has the five choices of the web page, the whole day first', () => {
    expect(HOUR_RANGES.map((range) => range.value)).toEqual([
      '00:00-23:59',
      '00:00-06:00',
      '06:00-12:00',
      '12:00-18:00',
      '18:00-23:59',
    ]);
  });
});

describe('parseHourlyReport', () => {
  const data = parseHourlyReport(answer);

  it('keeps the summary boxes', () => {
    expect(data.vehicles).toBe(16);
    expect(data.totalKm).toBe(17.62);
    expect(data.avgHourly).toBe(8.81);
    expect(data.operating).toBe('00:00 - 23:59');
    expect(data.maxSpeed).toBe(51);
    expect(data.generatedAt).toBe('12 Oct 2026 17:46');
  });

  it('turns the hours into rows', () => {
    expect(data.rows).toHaveLength(2);
    expect(data.rows[0]).toEqual({ key: '2026-10-12 00:00:00', date: '2026-10-12', km: 16.03, start: '00:00', end: '01:00', max: 51, min: 0 });
    expect(data.total).toBe(2);
  });

  it('copes with an empty answer', () => {
    const empty = parseHourlyReport({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.vehicles).toBe(0);
    expect(empty.totalKm).toBe(0);
  });
});

describe('buildHourlyCsv', () => {
  it('writes a header, one line per hour and a total', () => {
    const lines = buildHourlyCsv(parseHourlyReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Date,Distance (km),Hour Start,Hour End,Max Speed (km/h),Min Speed (km/h)');
    expect(lines[2]).toBe('1,2026-10-12,16.03,00:00,01:00,51.00,0.00');
    expect(lines[lines.length - 1]).toBe('Total,,17.62,,,,');
  });
});
