// The one-vehicle report summary (Trips, Driving, Parking, Engine, Speed, Fuel): which report calls to make for
// a date range, and how their answers become the numbers on the page. Pure functions, covered by tests.
import { getPresetRange } from './playbackRange';
import { getReportConfig } from './reportConfigs';
import { durationText, formatNumber, hmsToSeconds } from './reportFormat';
import { bodyOf } from './reportShared';

export const SUMMARY_PRESETS = [
  { key: 'today', label: 'Today' },
  { key: 'yesterday', label: 'Yesterday' },
  { key: 'week', label: 'Last 7 days' },
];

const TRIP_LIMIT = 100; // trips used for the little graph; the totals come from the report's own summary

/**
 * The report requests for one vehicle and a preset: [{ key, path, params }] for trip, activity, engine and fuel.
 * Engine is asked for one day only (the engine report takes a single date), so it is left out for longer ranges.
 * @param {number} vehicleId
 * @param {'today'|'yesterday'|'week'} preset
 * @param {number} nowMs Current time (only changed in tests)
 */
export function buildSummaryRequests(vehicleId, preset, nowMs = Date.now()) {
  const range = getPresetRange(preset, nowMs);
  const isSingleDay = range.fromDate === range.toDate;
  const from = `${range.fromDate} ${range.fromTime}`;
  const to = `${range.toDate} ${range.toTime}`;
  const trip = getReportConfig('trip');
  const activity = getReportConfig('activity');
  const engine = getReportConfig('engine');
  const fuel = getReportConfig('fuel');

  const requests = [
    { key: 'trip', path: trip.path, params: trip.buildParams({ vehicleId, from, to }, 1, TRIP_LIMIT) },
    {
      key: 'activity',
      path: activity.path,
      params: activity.buildParams({ vehicleId, from: range.fromDate, to: range.toDate, minDistance: 1 }, 1, 1),
    },
    {
      key: 'fuel',
      path: fuel.path,
      // The fuel report is fleet wide unless it is told which vehicle
      params: { ...fuel.buildParams({ from, to }, 1, 1), device_id: [vehicleId] },
    },
  ];
  if (isSingleDay) {
    requests.push({
      key: 'engine',
      path: engine.path,
      params: engine.buildParams({ vehicleId, date: range.fromDate }, 1, 1),
    });
  }
  return requests;
}

/** Running total of the trips' distance, oldest first, starting from 0 so the graph rises: its points. */
export function buildDistanceSeries(trips) {
  const sorted = [...(trips || [])].sort((a, b) => String(a.start_time).localeCompare(String(b.start_time)));
  let total = 0;
  const points = sorted.map((item) => {
    total += Number(item.distance) || 0;
    return Math.round(total * 100) / 100;
  });
  return points.length > 0 ? [0, ...points] : [];
}

/**
 * Turn the answers into the numbers shown. A report that failed (null) leaves its numbers as null ("-").
 * @param {{ trip, activity, engine, fuel }} answers Raw server answers (or null)
 * @returns {{ distanceKm: string|null, distanceValue: number|null, engineSeconds: number|null, trips: string|null, driving: string|null, parking: string|null,
 *   engine: string|null, avgSpeed: string|null, fuel: string|null, series: number[] }}
 */
export function buildReportSummary({ trip, activity, engine, fuel }) {
  const tripSummary = (trip && trip.summary) || null;
  const activitySummary = activity ? bodyOf(activity).summary : null;
  const fuelTotals = fuel ? bodyOf(fuel).totals : null;
  const engineTotals = engine ? engine.totals : null;

  const hasFuelSensor = !!fuelTotals && Number(fuelTotals.vehicles) > 0;
  const avgSpeed = tripSummary ? Math.round(Number(tripSummary.avg_speed) || 0) : null;

  return {
    distanceKm: tripSummary ? formatNumber(tripSummary.distance ?? 0) : null,
    // Plain numbers, for the fuel estimate
    distanceValue: tripSummary ? Number(tripSummary.distance) || 0 : null,
    engineSeconds: engineTotals && engineTotals.on ? hmsToSeconds(engineTotals.on) : null,
    trips: tripSummary ? String(tripSummary.trips ?? (trip.items || []).length) : null,
    driving: tripSummary && tripSummary.duration ? durationText(tripSummary.duration) : null,
    parking: activitySummary && activitySummary.stop_time ? durationText(activitySummary.stop_time) : null,
    engine: engineTotals && engineTotals.on ? durationText(engineTotals.on) : null,
    avgSpeed: avgSpeed === null ? null : `${avgSpeed} km/h`,
    fuel: hasFuelSensor ? `${formatNumber(fuelTotals.fuel_consumed ?? 0)} L` : null,
    series: trip ? buildDistanceSeries(trip.items) : [],
  };
}
