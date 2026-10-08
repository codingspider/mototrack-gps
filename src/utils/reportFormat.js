// Small text helpers for the reports. Times in report answers are already Bangladesh time, so they are only
// re-written (never converted). Pure functions.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { formatDuration } from './playbackStats';

dayjs.extend(utc);

export const EMPTY = '-';
const BD_UTC_OFFSET_HOURS = 6;

/** First two parts of a long address: "Brac Bank, Bogra City Bypass". */
export function placeShort(address) {
  if (!address) {
    return EMPTY;
  }
  return String(address)
    .split(',')
    .slice(0, 2)
    .map((part) => part.trim())
    .join(', ');
}

/**
 * Clock time as "08:11 AM" from "2026-10-08 08:11:35", "08:11", "08:10:02 AM" or "08 Oct 2026 00:00:00".
 * Returns "-" when there is no time in the text.
 */
export function clock12(text) {
  const match = String(text || '').match(/(\d{1,2}):(\d{2})(?::\d{2})?(?:\s*([AP]M))?\s*$/i);
  if (!match) {
    return EMPTY;
  }
  let hours = Number(match[1]);
  const marker = match[3] ? match[3].toUpperCase() : hours >= 12 ? 'PM' : 'AM';
  if (!match[3]) {
    hours = hours % 12 === 0 ? 12 : hours % 12;
  }
  return `${String(hours).padStart(2, '0')}:${match[2]} ${marker}`;
}

/** Badge with the clock time: { top: '08:11', bottom: 'AM' }. */
export function timeBadge(text) {
  const clock = clock12(text);
  if (clock === EMPTY) {
    return { top: '--', bottom: '' };
  }
  const [time, marker] = clock.split(' ');
  return { top: time, bottom: marker };
}

/** Badge with the hour only: { top: '08', bottom: 'AM' } from "08:00". */
export function hourBadge(text) {
  const badge = timeBadge(text);
  return { top: badge.top.split(':')[0], bottom: badge.bottom };
}

/** Badge with the day: { top: '01', bottom: 'OCT' } from "2026-10-01" (or a date-time). */
export function dateBadge(text) {
  if (!text) {
    return { top: '--', bottom: '' };
  }
  const date = dayjs(String(text).slice(0, 10));
  return { top: date.format('DD'), bottom: date.format('MMM').toUpperCase() };
}

/** "Thursday" from "2026-10-01". */
export function weekdayName(text) {
  return dayjs(String(text).slice(0, 10)).format('dddd');
}

/** "00:45:42" -> seconds. */
export function hmsToSeconds(text) {
  const parts = String(text || '').split(':').map(Number);
  if (parts.length !== 3 || parts.some(Number.isNaN)) {
    return 0;
  }
  return parts[0] * 3600 + parts[1] * 60 + parts[2];
}

/** "00:45:42" -> "45m", "52:57:01" -> "52h 57m". */
export function durationText(hms) {
  const seconds = hmsToSeconds(hms);
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  return formatDuration(seconds);
}

/** 1234.5 -> "1,234.5". */
export function formatNumber(value, decimals = 1) {
  const number = Number(value);
  if (Number.isNaN(number)) {
    return EMPTY;
  }
  const [whole, fraction] = number.toFixed(decimals).split('.');
  const withCommas = whole.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  return fraction ? `${withCommas}.${fraction}` : withCommas;
}

/** Last 12 months, newest first: [{ value: '2026-10', label: 'October 2026' }]. */
export function monthOptions(nowMs = Date.now()) {
  const bdMonth = dayjs.utc(nowMs).add(BD_UTC_OFFSET_HOURS, 'hour').format('YYYY-MM');
  const options = [];
  for (let step = 0; step < 12; step += 1) {
    const month = dayjs(`${bdMonth}-01`).subtract(step, 'month');
    options.push({ value: month.format('YYYY-MM'), label: month.format('MMMM YYYY') });
  }
  return options;
}
