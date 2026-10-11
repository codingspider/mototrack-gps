// Every customer report: how to ask for it (filters, params) and how to turn the answer into rows.
import { daily, hourly, location, monthly, speed, trip } from './reportConfigsA';
import { activity, due, engine, fuel, lastlocation, movement, overspeed, payment } from './reportConfigsB';

// Order of the cards on the Reports page (same as the design)
export const REPORTS = [daily, monthly, hourly, trip, speed, location, lastlocation, activity, movement, engine, fuel, payment];

// Cards shown on the hub: the reports, then the due report and overspeed alerts
export const HUB_CARDS = [...REPORTS, due, overspeed];

const byKey = Object.fromEntries([...REPORTS, due, overspeed].map((report) => [report.key, report]));

/** @param {string} key Report key, e.g. 'daily' */
export function getReportConfig(key) {
  return byKey[key];
}

/** Today / a week ago / this month, in Bangladesh time, plus the first vehicle: what the filters start from. */
export function buildDefaultFilters(config, vehicleId, today, weekAgo) {
  return config.defaults({ vehicleId, today, weekAgo, month: today.slice(0, 7) });
}
