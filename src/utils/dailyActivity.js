// Daily activity report (the web "Daily Activity" page): time choices, which quick button is active, how an
// answer of GET /reports/distance-report/daily becomes screen data, and the CSV text. Pure functions.
import { getPresetRange } from './playbackRange';

const MINUTES_PER_DAY = 24 * 60;
const HALF_HOUR = 30;

/** "08:30" -> "08:30 AM" */
function clockLabel(value) {
  const [hours, minutes] = value.split(':').map(Number);
  const marker = hours >= 12 ? 'PM' : 'AM';
  const hour12 = hours % 12 === 0 ? 12 : hours % 12;
  return `${String(hour12).padStart(2, '0')}:${String(minutes).padStart(2, '0')} ${marker}`;
}

/** 12:00 AM ... 11:30 PM every 30 minutes, then 11:59 PM (the same list as the web page). */
export const TIME_OPTIONS = (() => {
  const options = [];
  for (let minute = 0; minute < MINUTES_PER_DAY; minute += HALF_HOUR) {
    const value = `${String(Math.floor(minute / 60)).padStart(2, '0')}:${String(minute % 60).padStart(2, '0')}`;
    options.push({ value, label: clockLabel(value) });
  }
  options.push({ value: '23:59', label: clockLabel('23:59') });
  return options;
})();

/** The filters a quick button stands for. @param {'today'|'yesterday'|'week'} preset */
export function presetFilters(preset, nowMs = Date.now()) {
  return getPresetRange(preset, nowMs);
}

/**
 * Which quick button matches the filters: a whole day or days range is Today / Yesterday / Last 7 Days, anything else Custom.
 * @param {{ fromDate, toDate, fromTime, toTime }} filters
 * @returns {'today'|'yesterday'|'week'|'custom'}
 */
export function activePreset(filters, nowMs = Date.now()) {
  const isWholeDay = filters.fromTime === '00:00' && filters.toTime === '23:59';
  if (!isWholeDay) {
    return 'custom';
  }
  const names = ['today', 'yesterday', 'week'];
  const match = names.find((name) => {
    const range = getPresetRange(name, nowMs);
    return range.fromDate === filters.fromDate && range.toDate === filters.toDate;
  });
  return match || 'custom';
}

/**
 * GET /reports/distance-report/daily (V1\DistanceReportController@daily, same rules as the web report):
 * {
 *   status: 1, period: { start_date, end_date, start_time: '00:00', end_time: '23:59', days: 7 },
 *   total_km: 1872.65, generated_at: '12 Oct 2026 17:44',
 *   selected_device: { id, name, plate_number },
 *   items: [{ date: '06 Oct, 2026', date_raw: '2026-10-06', km: 44.17, start_time: '02:23:46 AM',
 *             end_time: '05:20:41 PM', duration: 53815, duration_format: '14:56:55' }],
 *   pagination: { current_page, per_page, total, last_page, from, to },
 *   distance_summary: { today_km: 40.8, total_km: 2334.04, total_since: '2026-09-26', total_source }
 * }
 */
export function parseDailyActivity(data) {
  const summary = data.distance_summary || {};
  const period = data.period || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  return {
    vehicleName: data.selected_device ? data.selected_device.name : '',
    periodDays: period.days || 0,
    totalKm: Number(data.total_km) || 0,
    todayKm: Number(summary.today_km) || 0,
    sinceKm: Number(summary.total_km) || 0,
    sinceDate: summary.total_since || '',
    generatedAt: data.generated_at || '',
    rows: items.map((item) => ({
      key: item.date_raw,
      date: item.date,
      km: Number(item.km) || 0,
      start: item.start_time,
      end: item.end_time,
      duration: item.duration_format,
    })),
    total: pagination.total ?? items.length,
    from: pagination.from ?? (items.length ? 1 : 0),
    to: pagination.to ?? items.length,
  };
}

/** The rows as CSV text (shared from the phone, like the web "Export CSV"). */
export function buildDailyCsv(vehicleName, rows) {
  const lines = ['SL,Date,KM,Start Time,End Time,Duration'];
  rows.forEach((row, index) => {
    lines.push([index + 1, `"${row.date}"`, row.km.toFixed(2), row.start, row.end, row.duration].join(','));
  });
  return `${vehicleName}\n${lines.join('\n')}`;
}

/** "26 Sep 2026" from "2026-09-26" (or '' when not known). */
export function sinceLabel(text) {
  if (!text) {
    return '';
  }
  const [year, month, day] = text.split('-');
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return `${day} ${months[Number(month) - 1]} ${year}`;
}
