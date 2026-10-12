// Fuel alert report (the web "Fuel Alert Details"): the alert type choices, how an answer of
// GET /reports/fuel-alert-report becomes screen data, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/** The "Fuel Alert Type" choice, like the web page. '' = every fuel alert. */
export const FUEL_ALERT_TYPES = [
  { value: '', label: 'All Fuel Alerts' },
  { value: 'fuel_fill', label: 'Fuel Filling' },
  { value: 'fuel_theft', label: 'Fuel Theft / Drop' },
  { value: 'custom_fuel', label: 'Other fuel alerts (custom)' },
];

/** "2026-10-12 14:36:35" -> "12 Oct 2026, 02:36 PM"; '-' when there is no time. */
export function alertTime(text) {
  if (!text) {
    return '-';
  }
  const date = dayjs(String(text).replace(' ', 'T'));
  return date.isValid() ? date.format('DD MMM YYYY, hh:mm A') : '-';
}

/** "10.50" for a number of litres, '-' when the alert has no amount. */
export function litresText(value) {
  return value === null || value === undefined ? '-' : Number(value).toFixed(2);
}

/**
 * {
 *   status: 1, generated_at: '12 Oct 2026 14:41',
 *   summary: { total, vehicles, fill_count, fill_total, theft_count, theft_total },
 *   items: [{ id, time: '2026-10-12 14:36:35', vehicle, plate, type: 'fuel_fill' | 'fuel_theft' | 'custom',
 *             label: 'Fuel Filling', amount: 12.5 | null, speed, latitude, longitude, address, map_url }],
 *   pagination: { total, per_page, current_page, last_page }
 * }
 */
export function parseFuelAlertReport(data) {
  const summary = data.summary || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  return {
    totalAlerts: Number(summary.total) || 0,
    fillings: Number(summary.fill_count) || 0,
    fillTotal: Number(summary.fill_total) || 0,
    thefts: Number(summary.theft_count) || 0,
    theftTotal: Number(summary.theft_total) || 0,
    vehicles: Number(summary.vehicles) || 0,
    generatedAt: data.generated_at || '',
    rows: items.map((item, index) => ({
      key: `${item.id}-${index}`,
      time: alertTime(item.time),
      vehicle: item.vehicle || '-',
      plate: item.plate || '-',
      alert: item.label || '-',
      type: item.type,
      amount: item.amount === null || item.amount === undefined ? null : Number(item.amount),
      speed: Number(item.speed) || 0,
      latitude: item.latitude === null || item.latitude === undefined ? null : Number(item.latitude),
      longitude: item.longitude === null || item.longitude === undefined ? null : Number(item.longitude),
      address: item.address || '-',
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildFuelAlertCsv(data) {
  const quote = (text) => `"${String(text).replace(/"/g, '""')}"`;
  const lines = ['SL,Date & Time,Vehicle,Plate,Alert,Amount (L),Speed (km/h),Location'];
  data.rows.forEach((row, index) => {
    lines.push(
      [index + 1, quote(row.time), quote(row.vehicle), quote(row.plate), quote(row.alert), litresText(row.amount), row.speed.toFixed(1), quote(row.address)].join(','),
    );
  });
  return `Fuel Alert Details\n${lines.join('\n')}`;
}
