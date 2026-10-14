// Warranty countdown maths for the Warranty page. Pure functions.
// The server (GET /warranty-check) works the countdown out in Bangladesh time and sends the seconds left at the moment
// it answered; the page keeps that count going on the phone until the next refresh.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

const BD_UTC_OFFSET_HOURS = 6;

/**
 * Turn the server answer into simple rows, soonest to run out first and the expired ones last.
 * @param {object} data Answer of GET /warranty-check without parameters: { status: 1, items: [...] }
 */
export function parseWarranties(data) {
  const list = data && Array.isArray(data.items) ? data.items : [];
  const rows = list.map((item) => ({
    deviceId: item.device_id,
    name: item.name || '',
    plateNumber: item.plate_number || '',
    startDate: item.warranty_start || null,
    endDate: item.warranty_end || null,
    period: item.warranty_period || '',
    isExpired: !!item.expired,
    secondsLeft: Number(item.countdown && item.countdown.total_seconds) || 0,
  }));
  return rows.sort((a, b) => {
    if (a.isExpired !== b.isExpired) {
      return a.isExpired ? 1 : -1;
    }
    return a.secondsLeft - b.secondsLeft;
  });
}

/**
 * Seconds left now: the seconds the server counted, minus the time that passed on the phone since it answered.
 * @param {number} secondsLeftAtFetch From the server
 * @param {number} fetchedAtMs When the phone received it
 * @param {number} nowMs Current time
 */
export function getSecondsLeft(secondsLeftAtFetch, fetchedAtMs, nowMs = Date.now()) {
  const hasFetchTime = fetchedAtMs !== null && fetchedAtMs !== undefined;
  const passed = hasFetchTime ? Math.floor((nowMs - fetchedAtMs) / 1000) : 0;
  return Math.max(0, Math.round(secondsLeftAtFetch) - Math.max(0, passed));
}

/** @returns {{ days: number, hours: number, minutes: number }} */
export function splitSeconds(totalSeconds) {
  const total = Math.max(0, Math.floor(totalSeconds));
  return {
    days: Math.floor(total / 86400),
    hours: Math.floor((total % 86400) / 3600),
    minutes: Math.floor((total % 3600) / 60),
  };
}

/** How much of the whole warranty period is still left, 0..1 (1 = just started, 0 = ended). */
export function getRemainingShare(startDate, endDate, secondsLeft) {
  if (!startDate || !endDate) {
    return 0;
  }
  // Bangladesh calendar days: the first day starts at 00:00 and the last one ends at 23:59:59
  const startMs = dayjs.utc(startDate).subtract(BD_UTC_OFFSET_HOURS, 'hour').valueOf();
  const endMs = dayjs.utc(`${endDate} 23:59:59`).subtract(BD_UTC_OFFSET_HOURS, 'hour').valueOf();
  const totalSeconds = (endMs - startMs) / 1000;
  if (!(totalSeconds > 0)) {
    return 0;
  }
  return Math.min(1, Math.max(0, secondsLeft / totalSeconds));
}

/** Counts of the list for the summary line. */
export function countWarranties(rows) {
  const expired = rows.filter((row) => row.isExpired).length;
  return { total: rows.length, expired, active: rows.length - expired };
}
