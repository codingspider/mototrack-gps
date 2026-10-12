// Location report (the web "Location Report Details"): how an answer of
// GET /reports/distance-report/location becomes screen data, and the CSV text. Pure functions.

/**
 * {
 *   status: 1, date: '2026-10-12', to_date: '2026-10-12', generated_at: '12 Oct 2026 20:37',
 *   items: [{ vehicle: 'Bogura LA 15-4717', vehicle_name, date: '2026-10-12', start_time: '00:19:51',
 *             end_time: '00:19:51', latitude: 24.853413, longitude: 89.349271, nearby: 'address', speed: 0,
 *             map_url: 'https://maps.google.com/?q=..' }],
 *   summary: { vehicles: 16, distance: 141.02, avg_speed: 26.87, operating: '00:00 - 23:59', max_speed: 62 },
 *   pagination: { current_page, per_page, total, last_page, from, to }
 * }
 */
export function parseLocationReport(data) {
  const summary = data.summary || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  return {
    vehicles: summary.vehicles ?? 0,
    totalKm: Number(summary.distance) || 0,
    avgSpeed: Number(summary.avg_speed) || 0,
    operating: summary.operating || '',
    maxSpeed: Number(summary.max_speed) || 0,
    generatedAt: data.generated_at || '',
    rows: items.map((item, index) => ({
      // a vehicle can have two points in the same second window, so the position keeps the key unique
      key: `${item.vehicle_name || item.vehicle}-${item.date}-${item.start_time}-${index}`,
      vehicle: item.vehicle_name || item.vehicle,
      date: item.date,
      start: item.start_time || item.clock_time,
      end: item.end_time || item.start_time || item.clock_time,
      latitude: item.latitude === null || item.latitude === undefined ? null : Number(item.latitude),
      longitude: item.longitude === null || item.longitude === undefined ? null : Number(item.longitude),
      nearby: item.nearby || '-',
      speed: Number(item.speed) || 0,
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The rows as CSV text (shared from the phone, like the web "Export"). */
export function buildLocationCsv(data) {
  const lines = ['SL,Vehicle,Date,Time (Start),Time (End),Latitude,Longitude,Near By,Speed (km/h)'];
  data.rows.forEach((row, index) => {
    const lat = row.latitude === null ? '' : row.latitude.toFixed(6);
    const lng = row.longitude === null ? '' : row.longitude.toFixed(6);
    lines.push(
      [index + 1, `"${row.vehicle}"`, row.date, row.start, row.end, lat, lng, `"${row.nearby.replace(/"/g, '""')}"`, row.speed.toFixed(2)].join(','),
    );
  });
  return `Location Report Details\n${lines.join('\n')}`;
}
