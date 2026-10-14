// The time shown under a vehicle's status.
//
// Engine Off and Idling are "since" states: what matters is WHEN the engine switched off / on, not when the tracker
// last sent a position (a parked tracker keeps reporting, so "last report" stays recent and looks wrong).
// The server sends that moment as `engine_changed_stamp` (unix seconds). Moving and Offline keep the last report time.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { englishText } from '../i18n/translations';
import { STATUS_ENGINE_OFF, STATUS_IDLING } from './vehicleStatus';
import { formatBdTime, formatTimeAgo } from './formatDate';

dayjs.extend(utc);

const BD_UTC_OFFSET_HOURS = 6;
const DAY_FORMAT = 'YYYY-MM-DD';
// A stamp before this is an empty or broken date (0000-00-00 and the like), not a real engine change
const MIN_VALID_STAMP = 946684800; // 1 Jan 2000

const bdDay = (stamp) => dayjs.unix(stamp).utc().add(BD_UTC_OFFSET_HOURS, 'hour').format(DAY_FORMAT);

/**
 * "08:40 AM" for a moment from today (Bangladesh), "12 Oct, 08:40 AM" for an earlier day.
 * @param {number} stamp Unix seconds
 * @param {number} nowMs Current time (only changed in tests)
 */
export function formatSinceTime(stamp, nowMs = Date.now()) {
  const clock = formatBdTime(stamp);
  if (bdDay(stamp) === bdDay(Math.floor(nowMs / 1000))) {
    return clock;
  }
  const date = dayjs.unix(stamp).utc().add(BD_UTC_OFFSET_HOURS, 'hour').format('DD MMM');
  return `${date}, ${clock}`;
}

/**
 * What to write under the status badge of a vehicle.
 * @param {object} vehicle Vehicle from Redux
 * @param {function} t Translate function (English when left out)
 * @param {number} nowMs Current time (only changed in tests)
 * @returns {string} e.g. "since 08:40 AM", "5 min ago", "-"
 */
export function getStatusTimeText(vehicle, t = englishText, nowMs = Date.now()) {
  const status = vehicle && vehicle.status;
  const changedAt = Number(vehicle && vehicle.engine_changed_stamp) || 0;
  const isSinceState = status === STATUS_ENGINE_OFF || status === STATUS_IDLING;

  if (isSinceState && changedAt > MIN_VALID_STAMP) {
    return t('time.since', { time: formatSinceTime(changedAt, nowMs) });
  }
  return formatTimeAgo(vehicle && vehicle.last_position_stamp, nowMs, t);
}
