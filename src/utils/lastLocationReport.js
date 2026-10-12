// Last location report (the web "Vehicle Last Location Report"): the quick ranges, how an answer of
// GET /reports/distance-report/lastlocation becomes screen data, and the CSV text. Pure functions.
import { getPresetRange } from './playbackRange';

/** The quick buttons, like the web page. `all` keeps every vehicle whatever its last location time. */
export const RANGES = [
  { key: 'all', label: 'All', icon: 'format-list-bulleted' },
  { key: 'today', label: 'Today', icon: 'calendar-today' },
  { key: 'yesterday', label: 'Yesterday', icon: 'calendar-arrow-left' },
  { key: 'last7', label: 'Last 7 Days', icon: 'calendar-week' },
  { key: 'custom', label: 'Custom', icon: 'calendar-edit' },
];

/** The dates a quick button stands for (today when it has none, as the date pickers still need a value). */
export function rangeDates(range, nowMs = Date.now()) {
  const names = { today: 'today', yesterday: 'yesterday', last7: 'week' };
  const { fromDate, toDate } = getPresetRange(names[range] || 'today', nowMs);
  return { fromDate, toDate };
}

/**
 * { success, response: { data: [{ vehicle, plate_number, customer, model, chassis_no, installation_date,
 *   status: 'online' | 'offline' | ..., last_loc_time: '2026-10-12 14:36:35', nearby, latitude, longitude }],
 *   pagination: { current_page, last_page, total }, generated_at: '12 Oct 2026 20:40' } }
 */
export function parseLastLocationReport(data) {
  const body = data.response || data;
  const items = body.data || [];
  const pagination = body.pagination || {};
  const dash = (value) => (value === null || value === undefined || value === '' ? '-' : String(value));
  return {
    generatedAt: body.generated_at || '',
    rows: items.map((item, index) => ({
      key: `${item.vehicle}-${index}`,
      vehicle: dash(item.vehicle),
      plate: item.plate_number && item.plate_number !== item.vehicle ? item.plate_number : '',
      customer: dash(item.customer),
      model: dash(item.model),
      chassis: dash(item.chassis_no),
      installation: dash(item.installation_date),
      isOnline: item.status === 'online',
      status: item.status === 'online' ? 'ONLINE' : 'OFFLINE',
      lastTime: dash(item.last_loc_time),
      nearby: dash(item.nearby),
      latitude: item.latitude === null || item.latitude === undefined ? null : Number(item.latitude),
      longitude: item.longitude === null || item.longitude === undefined ? null : Number(item.longitude),
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildLastLocationCsv(data) {
  const lines = ['SL,Vehicle,Customer (Subadmin),Model,Chassis No.,Installation,Last Status,Last Location Time,Nearby Landmark'];
  const quote = (text) => `"${String(text).replace(/"/g, '""')}"`;
  data.rows.forEach((row, index) => {
    lines.push(
      [index + 1, quote(row.vehicle), quote(row.customer), quote(row.model), quote(row.chassis), row.installation, row.status, row.lastTime, quote(row.nearby)].join(','),
    );
  });
  return `Vehicle Last Location Report\n${lines.join('\n')}`;
}
