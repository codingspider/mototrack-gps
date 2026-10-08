// Shows every date/time in Bangladesh time (Asia/Dhaka, UTC+6).
// Bangladesh has no daylight saving, so we add a fixed 6 hours to UTC. This works on every phone, while
// dayjs's timezone plugin needs Intl timezone data that Android's JS engine can be missing.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const BD_UTC_OFFSET_HOURS = 6;

function toUtcDate(value) {
  return typeof value === 'number' ? dayjs.unix(value).utc() : dayjs.utc(value);
}

/**
 * Format a unix timestamp (seconds) or a UTC date string as Bangladesh time.
 * @param {number|string|null} value
 * @returns {string}
 */
export function formatBdDateTime(value) {
  if (!value) {
    return '-';
  }
  return toUtcDate(value).add(BD_UTC_OFFSET_HOURS, 'hour').format('DD MMM YYYY, hh:mm A');
}

/** Bangladesh clock time of a unix timestamp (seconds): "09:45 AM". */
export function formatBdTime(timestamp) {
  if (!timestamp) {
    return '-';
  }
  return toUtcDate(timestamp).add(BD_UTC_OFFSET_HOURS, 'hour').format('hh:mm A');
}

/**
 * Format a calendar date such as an expiry date ("2026-10-31" or "2026-10-31 00:00:00") as "31 Oct 2026".
 * Only the date part is used, so no timezone can shift the day.
 * @param {string|null} value
 * @returns {string}
 */
export function formatDateOnly(value) {
  if (!value) {
    return '-';
  }
  return dayjs(String(value).slice(0, 10)).format('DD MMM YYYY');
}

/**
 * Whole days from today (Bangladesh date) until a calendar date. Negative when the date has passed.
 * @param {string|null} value e.g. "2026-10-18"
 * @param {number} nowMs Current time in ms (only changed in tests)
 * @returns {number|null} null when there is no date
 */
export function getDaysLeft(value, nowMs = Date.now()) {
  if (!value) {
    return null;
  }
  const bdToday = dayjs.utc(nowMs).add(BD_UTC_OFFSET_HOURS, 'hour').format('YYYY-MM-DD');
  return dayjs(String(value).slice(0, 10)).diff(dayjs(bdToday), 'day');
}

/**
 * Short "time ago" text for lists: "Just now", "5 min ago", "6 hrs ago", "2 days ago".
 * @param {number|string|null} value Unix seconds or a UTC date string
 * @param {number} nowMs Current time in ms (only changed in tests)
 * @returns {string}
 */
export function formatTimeAgo(value, nowMs = Date.now()) {
  if (!value) {
    return '-';
  }
  const minutes = dayjs(nowMs).diff(toUtcDate(value), 'minute');
  if (minutes < 1) {
    return 'Just now';
  }
  if (minutes < 60) {
    return `${minutes} min ago`;
  }
  const hours = Math.floor(minutes / 60);
  if (hours < 24) {
    return hours === 1 ? '1 hr ago' : `${hours} hrs ago`;
  }
  const days = Math.floor(hours / 24);
  return days === 1 ? '1 day ago' : `${days} days ago`;
}
