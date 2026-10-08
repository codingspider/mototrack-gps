// Pieces shared by the report definitions (reportConfigsA / reportConfigsB).
// A parsed report is { summary: [{ label, value, unit }], rows: [row], pagination: { page, lastPage, total }, note }.
// A row is { key, badge: { top, bottom }, tone, title, subtitle, value, valueSub, progress (0..1), action }.
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';

dayjs.extend(utc);

export const vehicleField = (allowAll = false, width = 'full') => ({
  key: 'vehicleId',
  type: 'vehicle',
  label: 'Vehicle',
  allowAll,
  width,
});

export const summaryItem = (label, value, unit = '') => ({ label, value: String(value), unit });

/** Page info from a server `pagination` object. */
export function pagingOf(pagination) {
  const lastPage = pagination?.last_page || 1;
  return { page: pagination?.current_page || 1, lastPage, total: pagination?.total ?? 0 };
}

/** 'YYYY-MM-DD HH:mm' -> its date part and time part. */
export const datePart = (text) => String(text).slice(0, 10);
export const timePart = (text) => String(text).slice(11, 16);

/** A report text time in Bangladesh clock ("2026-10-08 12:22:46") -> unix seconds. */
export function bdTextToUnix(text) {
  return dayjs.utc(text).subtract(6, 'hour').unix();
}

/** Share of the biggest value, 0..1, for the little bar on a row. */
export function shareOf(value, max) {
  return max > 0 ? Math.min(Math.max(Number(value) / max, 0), 1) : 0;
}

/** Server answers come as `{ status, ...}` or `{ success, response: {...} }`: give back the useful part. */
export const bodyOf = (data) => data.response || data;
