// Monthly distance overview (the web "Monthly Distance Overview"): how an answer of
// GET /reports/distance-report/monthly becomes screen data, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/**
 * {
 *   status: 1, dates: ['2026-10-12'], period: { from_date, to_date, from_time, to_time, days, label: '12 Oct 2026' },
 *   distance_unit: 'km', vehicles_count: 16, generated_at: '12 Oct 2026 17:44',
 *   items: [{ device_id, name, plate_number, by_date: { '2026-10-12': 40.8 }, total: 40.8 }],
 *   date_totals: { '2026-10-12': 78.21 }, fleet_total: 78.21,
 *   pagination: { current_page, per_page, total, last_page, from, to }
 * }
 */
export function parseMonthlyOverview(data) {
  const dates = data.dates || [];
  const period = data.period || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  const dateTotals = data.date_totals || {};
  return {
    periodLabel: period.label || '',
    unit: data.distance_unit || 'km',
    vehiclesCount: data.vehicles_count ?? items.length,
    generatedAt: data.generated_at || '',
    dates: dates.map((date) => ({ key: date, label: dayjs(date).format('DD MMM') })),
    rows: items.map((item) => ({
      key: String(item.device_id),
      name: item.name,
      plate: item.plate_number || '-',
      total: Number(item.total) || 0,
      byDate: item.by_date || {},
    })),
    dateTotals: dates.map((date) => Number(dateTotals[date]) || 0),
    fleetTotal: Number(data.fleet_total) || 0,
    total: pagination.total ?? items.length,
    from: pagination.from ?? (items.length ? 1 : 0),
    to: pagination.to ?? items.length,
  };
}

/** "40.80", or "-" for a day the vehicle did not move. */
export function kmCell(value) {
  const number = Number(value) || 0;
  return number > 0 ? number.toFixed(2) : '-';
}

/** The table as CSV text (shared from the phone, like the web "Export"). */
export function buildMonthlyCsv(data) {
  const head = ['SL', 'Vehicle', 'Plate Number', 'Total (km)', ...data.dates.map((date) => date.label)];
  const lines = [head.join(',')];
  data.rows.forEach((row, index) => {
    const cells = [index + 1, `"${row.name}"`, `"${row.plate}"`, row.total.toFixed(2)];
    data.dates.forEach((date) => cells.push((Number(row.byDate[date.key]) || 0).toFixed(2)));
    lines.push(cells.join(','));
  });
  return `Monthly Distance Overview (${data.periodLabel})\n${lines.join('\n')}`;
}
