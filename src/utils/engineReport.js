// Engine report (the web "Engine Report Details"): the status choices, how an answer of
// GET /reports/distance-report/engine/report becomes screen data, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/** The Status choice, like the web page. */
export const ENGINE_STATUS_OPTIONS = [
  { value: 'all', label: 'All Status' },
  { value: 'on', label: 'On' },
  { value: 'off', label: 'Off' },
  { value: 'idle', label: 'Idle' },
];

/** "12 Oct 2026 14:36:35" -> "12 Oct 2026, 02:36:35 PM"; the text itself when it is not a date. */
export function engineTime(text) {
  const date = dayjs(String(text || ''), 'DD MMM YYYY HH:mm:ss', true);
  if (date.isValid()) {
    return date.format('DD MMM YYYY, hh:mm:ss A');
  }
  const loose = dayjs(String(text || '').replace(' ', 'T'));
  return loose.isValid() ? loose.format('DD MMM YYYY, hh:mm:ss A') : String(text || '-');
}

/**
 * {
 *   status: 1, date, to_date, events: 90, generated_at: '12 Oct 2026 20:38',
 *   totals: { on: '04:21:55', off: '324:02:53', idle: '01:46:40' },
 *   items: [{ vehicle: 'Bogura LA 15-4717 (LA 15)', status: 'On' | 'Off' | 'Idle', from: '12 Oct 2026 00:00:00',
 *             to: '12 Oct 2026 00:19:51', duration: '00:19:51' }],
 *   pagination: { current_page, last_page, total }
 * }
 */
export function parseEngineReport(data) {
  const totals = data.totals || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  return {
    engineOn: totals.on || '00:00:00',
    engineOff: totals.off || '00:00:00',
    idle: totals.idle || '00:00:00',
    events: data.events ?? pagination.total ?? items.length,
    generatedAt: data.generated_at || '',
    rows: items.map((item, index) => ({
      key: `${item.vehicle}-${item.from}-${index}`,
      vehicle: item.vehicle || '-',
      status: item.status || '-',
      from: engineTime(item.from),
      to: engineTime(item.to),
      duration: item.duration || '-',
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildEngineCsv(data) {
  const lines = ['SL,Vehicle,Status,From,To,Duration'];
  data.rows.forEach((row, index) => {
    lines.push([index + 1, `"${row.vehicle}"`, row.status, `"${row.from}"`, `"${row.to}"`, row.duration].join(','));
  });
  return `Engine Report Details\n${lines.join('\n')}`;
}
