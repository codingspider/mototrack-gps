// Date and time ranges for playback. Everything is in Bangladesh time (UTC+6, no daylight saving).
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const BD_UTC_OFFSET_HOURS = 6;
export const PRESETS = ['today', 'yesterday', 'week', 'custom'];
export const PRESET_LABELS = { today: 'Today', yesterday: 'Yesterday', week: 'Last 7 Days', custom: 'Custom' };

/** Today's date in Bangladesh as a dayjs object (date only matters). */
function bdToday(nowMs) {
  return dayjs.utc(nowMs).add(BD_UTC_OFFSET_HOURS, 'hour');
}

const DAY = 'YYYY-MM-DD';

/**
 * The range to ask the server for.
 * @param {'today'|'yesterday'|'week'} preset
 * @param {number} nowMs Current time (only changed in tests)
 * @returns {{ fromDate, toDate, fromTime, toTime }}
 */
export function getPresetRange(preset, nowMs = Date.now()) {
  const today = bdToday(nowMs);
  if (preset === 'yesterday') {
    const yesterday = today.subtract(1, 'day').format(DAY);
    return { fromDate: yesterday, toDate: yesterday, fromTime: '00:00', toTime: '23:59' };
  }
  if (preset === 'week') {
    return { fromDate: today.subtract(6, 'day').format(DAY), toDate: today.format(DAY), fromTime: '00:00', toTime: '23:59' };
  }
  return { fromDate: today.format(DAY), toDate: today.format(DAY), fromTime: '00:00', toTime: '23:59' };
}

/**
 * The last day a calendar may offer: today's date in Bangladesh, as a Date at the end of that day on the phone's own
 * clock. (`new Date()` is the phone's time zone, so a phone set to another region could block or allow the wrong day.)
 */
export function getBdTodayEndDate(nowMs = Date.now()) {
  return dayjs(`${bdToday(nowMs).format(DAY)}T23:59:59`).toDate();
}

/** "2026-10-08" from a Date picked in the calendar (uses the Date's own year, month and day). */
export function dateToText(date) {
  return dayjs(date).format(DAY);
}

/** { hours: 8, minutes: 5 } -> "08:05" */
export function timeToText({ hours, minutes }) {
  return `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}`;
}

/** Whether the range ends before it starts. */
export function isRangeBackwards({ fromDate, toDate, fromTime, toTime }) {
  return dayjs(`${fromDate} ${fromTime}`).isAfter(dayjs(`${toDate} ${toTime}`));
}

/** "00:00" -> "12:00 AM", "23:59" -> "11:59 PM", "13:05" -> "01:05 PM" (a text that is not a time is kept as it is). */
export function formatClockText(time) {
  const match = /^(\d{1,2}):(\d{2})/.exec(String(time || ''));
  if (!match) {
    return String(time || '');
  }
  const hours = Number(match[1]) % 24;
  const suffix = hours < 12 ? 'AM' : 'PM';
  const hours12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hours12).padStart(2, '0')}:${match[2]} ${suffix}`;
}

/** Short text for the header: "08 Oct 2026 · 12:00 AM – 11:59 PM" or "02 Oct 12:00 AM – 08 Oct 11:59 PM". */
export function describeRange({ fromDate, toDate, fromTime, toTime }) {
  const from = dayjs(fromDate);
  const to = dayjs(toDate);
  if (fromDate === toDate) {
    return `${from.format('DD MMM YYYY')} · ${formatClockText(fromTime)} – ${formatClockText(toTime)}`;
  }
  return `${from.format('DD MMM')} ${formatClockText(fromTime)} – ${to.format('DD MMM')} ${formatClockText(toTime)}`;
}

/** Same range as a stable text, used to tell whether the data on screen belongs to it. */
export function rangeKey(deviceId, range) {
  return `${deviceId}|${range.fromDate}|${range.toDate}|${range.fromTime}|${range.toTime}`;
}
