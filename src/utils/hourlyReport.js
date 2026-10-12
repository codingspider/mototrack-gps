// Hourly report (the web "Hourly Report Details"): the time-of-day choices, how an answer of
// GET /reports/distance-report/hourly becomes screen data, and the CSV text. Pure functions.

/** The time of day window of every day, the same five choices as the web page. */
export const HOUR_RANGES = [
  { value: '00:00-23:59', label: '00:00 - 23:59' },
  { value: '00:00-06:00', label: '00:00 - 06:00' },
  { value: '06:00-12:00', label: '06:00 - 12:00' },
  { value: '12:00-18:00', label: '12:00 - 18:00' },
  { value: '18:00-23:59', label: '18:00 - 23:59' },
];

/**
 * {
 *   status: 1, sum_km: 85.25, devices_count: 16, generated_at: '12 Oct 2026 17:46',
 *   items: [{ hour: '2026-10-12 00:00:00', date: '2026-10-12', km: 16.03, hour_start: '00:00', hour_end: '01:00',
 *             max_speed: 51, min_speed: 0 }],
 *   totals: { distance, max, min },
 *   summary: { vehicles: 16, distance: 85.25, avg_hourly: 10.66, operating: '00:00 - 23:59', max_speed: 62 },
 *   pagination: { current_page, per_page, total, last_page, from, to }
 * }
 */
export function parseHourlyReport(data) {
  const summary = data.summary || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  return {
    vehicles: summary.vehicles ?? data.devices_count ?? 0,
    totalKm: Number(summary.distance ?? data.sum_km) || 0,
    avgHourly: Number(summary.avg_hourly) || 0,
    operating: summary.operating || '',
    maxSpeed: Number(summary.max_speed) || 0,
    generatedAt: data.generated_at || '',
    rows: items.map((item) => ({
      key: item.hour,
      date: item.date,
      km: Number(item.km) || 0,
      start: item.hour_start,
      end: item.hour_end,
      max: Number(item.max_speed) || 0,
      min: Number(item.min_speed) || 0,
    })),
    total: pagination.total ?? items.length,
    from: pagination.from ?? (items.length ? 1 : 0),
    to: pagination.to ?? items.length,
  };
}

/** The rows as CSV text (shared from the phone, like the web "Export"). */
export function buildHourlyCsv(data) {
  const lines = ['SL,Date,Distance (km),Hour Start,Hour End,Max Speed (km/h),Min Speed (km/h)'];
  data.rows.forEach((row, index) => {
    lines.push([index + 1, row.date, row.km.toFixed(2), row.start, row.end, row.max.toFixed(2), row.min.toFixed(2)].join(','));
  });
  lines.push(`Total,,${data.totalKm.toFixed(2)},,,,`);
  return `Hourly Report Details\n${lines.join('\n')}`;
}
