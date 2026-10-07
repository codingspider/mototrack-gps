// Shows every date/time in Bangladesh time (Asia/Dhaka, UTC+6).
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';

dayjs.extend(utc);
dayjs.extend(timezone);

const BD_TZ = 'Asia/Dhaka';

/**
 * Format a unix timestamp (seconds) or a UTC date string as Bangladesh time.
 * @param {number|string|null} value
 * @returns {string}
 */
export function formatBdDateTime(value) {
  if (!value) {
    return '-';
  }
  const date = typeof value === 'number' ? dayjs.unix(value) : dayjs.utc(value);
  return date.tz(BD_TZ).format('DD MMM YYYY, hh:mm A');
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
  const date = typeof value === 'number' ? dayjs.unix(value) : dayjs.utc(value);
  const minutes = dayjs(nowMs).diff(date, 'minute');
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