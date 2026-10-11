// The one-vehicle report summary: which calls are made, and how the answers become the numbers on the page.
import { buildDistanceSeries, buildReportSummary, buildSummaryRequests } from '../src/utils/reportSummary';

const NOW = Date.UTC(2026, 9, 11, 6, 0, 0); // 11 Oct 2026, 12:00 in Bangladesh

describe('buildSummaryRequests', () => {
  it('asks trips, activity, fuel and engine for a single day', () => {
    const requests = buildSummaryRequests(6, 'today', NOW);
    expect(requests.map((request) => request.key)).toEqual(['trip', 'activity', 'fuel', 'engine']);
    const trip = requests.find((request) => request.key === 'trip');
    expect(trip.path).toBe('/reports/distance-report/trip');
    expect(trip.params).toMatchObject({ device_id: 6, from_day: 11, from_month: 10, from_year: 2026, from_time: '00:00', to_time: '23:59' });
    const engine = requests.find((request) => request.key === 'engine');
    expect(engine.params).toMatchObject({ device_id: 6, date: '2026-10-11' });
  });

  it('limits the fuel report to the vehicle', () => {
    const fuel = buildSummaryRequests(6, 'today', NOW).find((request) => request.key === 'fuel');
    expect(fuel.params.device_id).toEqual([6]);
  });

  it('leaves the engine report out for a week (it takes one date)', () => {
    const requests = buildSummaryRequests(6, 'week', NOW);
    expect(requests.map((request) => request.key)).toEqual(['trip', 'activity', 'fuel']);
    const trip = requests.find((request) => request.key === 'trip');
    expect(trip.params).toMatchObject({ from_day: 5, to_day: 11 });
  });
});

describe('buildDistanceSeries', () => {
  it('is the running total of the trips, oldest first', () => {
    const trips = [
      { start_time: '2026-10-11 09:00:00', distance: 5 },
      { start_time: '2026-10-11 07:00:00', distance: 2.5 },
      { start_time: '2026-10-11 11:00:00', distance: 1.25 },
    ];
    expect(buildDistanceSeries(trips)).toEqual([0, 2.5, 7.5, 8.75]);
    expect(buildDistanceSeries(undefined)).toEqual([]);
  });
});

describe('buildReportSummary', () => {
  const trip = {
    summary: { trips: 28, distance: 672.3, duration: '06:12:10', avg_speed: 58.4 },
    items: [{ start_time: '2026-10-11 08:00:00', distance: 10 }],
  };
  const activity = { response: { summary: { stop_time: '03:24:00' } } };
  const engine = { totals: { on: '06:12:00', off: '10:00:00', idle: '00:20:00' } };

  it('writes every number', () => {
    const result = buildReportSummary({ trip, activity, engine, fuel: { response: { totals: { vehicles: 1, fuel_consumed: 102.54 } } } });
    expect(result).toMatchObject({
      distanceKm: '672.3',
      trips: '28',
      driving: '6h 12m',
      parking: '3h 24m',
      engine: '6h 12m',
      avgSpeed: '58 km/h',
      fuel: '102.5 L',
      series: [0, 10],
    });
  });

  it('shows no fuel when the vehicle has no fuel sensor', () => {
    const result = buildReportSummary({ trip, activity, engine, fuel: { response: { totals: { vehicles: 0, fuel_consumed: 0 } } } });
    expect(result.fuel).toBeNull();
  });

  it('keeps going when one report failed', () => {
    const result = buildReportSummary({ trip, activity: null, engine: null, fuel: null });
    expect(result).toMatchObject({ distanceKm: '672.3', parking: null, engine: null, fuel: null });
  });
});
