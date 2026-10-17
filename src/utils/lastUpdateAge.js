// How old a vehicle's last location is, so a list can color stale vehicles (amber after 1 hour, red after 1 day).
const HOUR_SECONDS = 3600;
const DAY_SECONDS = 24 * HOUR_SECONDS;

/**
 * @param {number|null} stamp Unix seconds (UTC) of the last location
 * @param {number} nowMs Current time in ms (only changed in tests)
 * @returns {'fresh'|'old'|'stale'} fresh < 1 hour, old < 1 day, stale = 1 day or more. A missing time counts as stale.
 */
export function getLastUpdateAge(stamp, nowMs = Date.now()) {
  if (!stamp) {
    return 'stale';
  }
  const seconds = Math.floor(nowMs / 1000) - Number(stamp);
  if (seconds >= DAY_SECONDS) {
    return 'stale';
  }
  if (seconds >= HOUR_SECONDS) {
    return 'old';
  }
  return 'fresh';
}
