import { buildDefaultFilters, getReportConfig, HUB_CARDS } from '../src/utils/reportConfigs';
import { clock12, dateBadge, durationText, formatNumber, hmsToSeconds, monthOptions, placeShort, timeBadge } from '../src/utils/reportFormat';

const TODAY = '2026-10-08';
const parse = (key, data, filters = {}) => getReportConfig(key).parse(data, filters, TODAY);

describe('report text helpers', () => {
  it('writes clock times the same way for every kind of answer', () => {
    expect(clock12('2026-10-08 08:11:35')).toBe('08:11 AM');
    expect(clock12('08:10:02 AM')).toBe('08:10 AM');
    expect(clock12('08 Oct 2026 14:05:00')).toBe('02:05 PM');
    expect(clock12('00:00')).toBe('12:00 AM');
    expect(clock12('')).toBe('-');
  });
  it('builds badges, durations and numbers', () => {
    expect(timeBadge('2026-10-08 08:11:35')).toEqual({ top: '08:11', bottom: 'AM' });
    expect(dateBadge('2026-10-01')).toEqual({ top: '01', bottom: 'OCT' });
    expect(hmsToSeconds('00:45:42')).toBe(2742);
    expect(durationText('52:57:01')).toBe('52h 57m');
    expect(durationText('00:04:13')).toBe('4m');
    expect(formatNumber(1234.56)).toBe('1,234.6');
    expect(placeShort('Brac Bank, Bogra City Bypass, Nishindara, Bogura')).toBe('Brac Bank, Bogra City Bypass');
  });
  it('offers the last 12 months, newest first', () => {
    const options = monthOptions(Date.UTC(2026, 9, 8));
    expect(options).toHaveLength(12);
    expect(options[0]).toEqual({ value: '2026-10', label: 'October 2026' });
    expect(options[11].value).toBe('2025-11');
  });
});

describe('daily report', () => {
  const data = {
    status: 1,
    items: [
      { date_raw: '2026-10-01', km: 70.23, start_time: '08:10:02 AM', end_time: '08:53:58 PM', duration_format: '12:43:56' },
      { date_raw: '2026-10-02', km: 0, start_time: null, end_time: null, duration_format: '00:00:00' },
    ],
    pagination: { current_page: 1, last_page: 1, total: 2 },
  };
  it('makes a row per day and sums the summary', () => {
    const result = parse('daily', data);
    expect(result.rows).toHaveLength(2);
    expect(result.rows[0]).toMatchObject({ title: 'Thursday', value: '70.2 km', subtitle: '08:10 AM – 08:53 PM' });
    expect(result.rows[1].subtitle).toBe('Parked all day');
    expect(result.summary.map((item) => item.value)).toEqual(['70', '1', '70']);
  });
  it('asks the server in the right shape', () => {
    const config = getReportConfig('daily');
    const filters = buildDefaultFilters(config, 6, TODAY, '2026-10-02');
    expect(config.buildParams(filters, 1, 100)).toEqual({
      device_id: 6,
      date_from: '2026-10-02 00:00',
      date_to: '2026-10-08 23:59',
      limit: 100,
      page: 1,
    });
  });
});

describe('monthly report', () => {
  const data = { days: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10], items: [{ days: { 1: 70.2, 2: 0, 3: 99.3, 8: 118.1 }, total: 287.6 }] };
  it('stops at today for the current month', () => {
    const result = parse('monthly', data, { month: '2026-10' });
    expect(result.rows).toHaveLength(8); // days 9 and 10 are in the future
    expect(result.rows[1].subtitle).toBe('Parked all day');
    expect(result.summary[1]).toMatchObject({ value: '3', unit: '/ 8' });
  });
});

describe('hourly, trips and speed', () => {
  it('finds the busiest hour', () => {
    const data = {
      sum_km: 118.12,
      summary: { max_speed: 54 },
      items: [
        { hour: 'a', date: '2026-10-08', km: 7.36, hour_start: '08:00', hour_end: '09:00', max_speed: 42 },
        { hour: 'b', date: '2026-10-08', km: 21.8, hour_start: '09:00', hour_end: '10:00', max_speed: 54 },
      ],
    };
    const result = parse('hourly', data);
    expect(result.summary[1]).toMatchObject({ value: '9–10', unit: 'AM' });
    expect(result.rows[1].badge).toEqual({ top: '09', bottom: 'AM' });
  });
  it('opens a trip in playback with its own time range', () => {
    const data = {
      summary: { trips: 55, distance: 289.06, duration: '52:57:01' },
      items: [{ start_time: '2026-10-01 08:11:35', end_time: '2026-10-01 08:15:48', duration: '00:04:13', distance: 2.07, speed: 28.37, from: 'A, B, C', to: 'D, E' }],
    };
    const result = parse('trip', data, { vehicleId: 6 });
    expect(result.summary[2].value).toBe('52h 57m');
    expect(result.rows[0].title).toBe('A → D');
    expect(result.rows[0].action).toEqual({
      type: 'playback',
      vehicleId: 6,
      range: { fromDate: '2026-10-01', toDate: '2026-10-01', fromTime: '08:11', toTime: '08:15' },
    });
  });
  it('colors fast speed readings red', () => {
    const data = {
      chart: { max: [10, 78, 61] },
      speed_summary: { max_speed: 78, avg_speed: 34 },
      items: [{ time: '09:41', max_speed: 78, avg_speed: 50, min_speed: 20 }],
    };
    const result = parse('speed', data);
    expect(result.summary[2]).toMatchObject({ label: 'Over 60', value: '2' });
    expect(result.rows[0].tone).toBe('danger');
  });
});

describe('fleet reports', () => {
  it('handles the { response } envelope of last location', () => {
    const data = {
      success: true,
      response: {
        data: [
          { vehicle: 'Bogura LA', status: 'online', last_loc_time: '2026-10-08 12:22:46', nearby: 'Brac Bank, Bogra', latitude: 24.8543, longitude: 89.3481 },
          { vehicle: 'DM GA', status: 'offline', last_loc_time: '2026-10-06 09:00:00', nearby: 'Tongi, Gazipur', latitude: 23.89, longitude: 90.4 },
        ],
        pagination: { current_page: 1, last_page: 1, total: 2 },
      },
    };
    const result = parse('lastlocation', data);
    expect(result.summary.map((item) => item.value)).toEqual(['2', '1', '1']);
    expect(result.rows[0].badge.bottom).toBe('PM'); // today: shows the time
    expect(result.rows[1].badge).toEqual({ top: '06', bottom: 'OCT' }); // older: shows the day
  });
  it('leaves out vehicles that did not move in the activity report', () => {
    const data = {
      response: {
        data: [
          { bstid: 'A', start_time: '2026-10-08 08:46:04', end_time: '2026-10-08 09:48:07', duration: '00:45:42', distance: 25.17, trips: 3 },
          { bstid: 'B', start_time: null, end_time: null, duration: '00:00:00', distance: 0, trips: 0 },
        ],
        summary: { distance: 25.17, trips: 3, stop_time: '00:18:23' },
      },
    };
    const result = parse('activity', data);
    expect(result.rows).toHaveLength(1);
    expect(result.rows[0].title).toBe('A');
  });
  it('applies the engine status choice', () => {
    const data = {
      totals: { on: '00:46:12', idle: '00:03:57' },
      items: [
        { status: 'Off', from: '08 Oct 2026 00:00:00', to: '08 Oct 2026 08:44:02', duration: '08:44:02' },
        { status: 'On', from: '08 Oct 2026 08:44:02', to: '08 Oct 2026 09:30:00', duration: '00:46:12' },
      ],
    };
    expect(parse('engine', data, { status: 'all' }).rows).toHaveLength(2);
    const onlyOn = parse('engine', data, { status: 'On' });
    expect(onlyOn.rows).toHaveLength(1);
    expect(onlyOn.rows[0]).toMatchObject({ title: 'Engine on', value: '46m', tone: 'success' });
  });
  it('shows the fuel totals and an empty message', () => {
    const data = { response: { data: [], totals: { fuel_consumed: 0, distance_km: 0 }, pagination: {} } };
    const result = parse('fuel', data);
    expect(result.rows).toEqual([]);
    expect(result.note).toContain('fuel sensor');
  });
  it('filters payments and writes amounts in taka', () => {
    const data = {
      totals: { paid_amount: 1500, due_amount: 1800 },
      items: [
        { device_id: 1, name: 'A', payment_status: 'paid', last_payment: '2026-10-06', amount: 500, expiration_date: '2026-11-06', is_expired: false },
        { device_id: 2, name: 'B', payment_status: 'due', last_payment: null, amount: null, expiration_date: null, is_expired: false },
      ],
    };
    expect(parse('payment', data, { show: 'all' }).rows).toHaveLength(2);
    const paid = parse('payment', data, { show: 'paid' });
    expect(paid.rows).toHaveLength(1);
    expect(paid.rows[0]).toMatchObject({ value: '৳ 500', valueSub: 'Paid', tone: 'success' });
    expect(parse('payment', data, { show: 'all' }).summary[0].value).toBe('৳ 1,500');
  });
  it('writes payment states as words and shows a taka sign when never paid', () => {
    const data = {
      items: [{ device_id: 3, name: 'C', payment_status: 'expiring_soon', last_payment: null, amount: 300, is_expired: false, is_expiring_soon: true }],
    };
    const row = parse('payment', data, { show: 'all' }).rows[0];
    expect(row).toMatchObject({ valueSub: 'Expiring soon', tone: 'warning', badge: { top: '৳', bottom: '' } });
  });
  it('lists overspeed alerts newest first, with the amount over the limit', () => {
    const data = {
      total: 2,
      truncated: true,
      alerts: [
        { id: 1, time: '2026-10-02 17:57:16', timestamp: 100, lat: 24.9, lng: 89.2, speed: 53 },
        { id: 2, time: '2026-10-03 09:00:00', timestamp: 200, lat: 24.8, lng: 89.3, speed: 70 },
      ],
    };
    const result = parse('overspeed', data, { limit: 50 });
    expect(result.rows[0]).toMatchObject({ key: '2', title: '20 km/h over the limit' });
    expect(result.note).toContain('first part');
  });
});

describe('the report list', () => {
  it('has a card for every report plus driving behaviour and overspeed', () => {
    expect(HUB_CARDS).toHaveLength(14);
    expect(HUB_CARDS.filter((card) => card.isReady === false).map((card) => card.key)).toEqual(['driving']);
  });
});
