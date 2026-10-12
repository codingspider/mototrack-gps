// Trip report (the web "Trip Report Details"): how an answer of GET /reports/distance-report/trip becomes screen
// data, the request params of a period, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/**
 * The query params of one vehicle and period. The server takes the day, month and year apart, like the web form.
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, fromTime: string, toTime: string }} filters
 */
export function buildTripParams(filters, page, limit) {
  const from = dayjs(filters.fromDate);
  const to = dayjs(filters.toDate);
  const hasSearch = !!(filters.search && filters.search.trim());
  const params = {
    from_day: from.date(),
    from_month: from.month() + 1,
    from_year: from.year(),
    from_time: filters.fromTime,
    to_day: to.date(),
    to_month: to.month() + 1,
    to_year: to.year(),
    to_time: filters.toTime,
    limit,
    page,
  };
  if (hasSearch) {
    // The search narrows the vehicle list: the server takes the first match
    params.search_phrase = filters.search.trim();
  } else if (filters.vehicleId) {
    params.device_id = filters.vehicleId;
  }
  return params;
}

/**
 * {
 *   status: 1, generated_at: '12 Oct 2026 14:39', selected_device: { id, name, plate_number },
 *   summary: { trips: 4, distance: 19.14, duration: '00:50:33', avg_speed: 22.72 },
 *   items: [{ start_time: '2026-10-12 08:45:37', end_time: '2026-10-12 08:47:22', duration: '00:01:45',
 *             distance: 0.86, speed: 27.38, from: 'address', to: 'address', from_lat, from_lng, to_lat, to_lng }],
 *   pagination: { current_page, last_page, total }
 * }
 */
export function parseTripReport(data) {
  const summary = data.summary || {};
  const items = data.items || [];
  const pagination = data.pagination || {};
  const dash = (value) => (value === null || value === undefined || value === '' ? '-' : String(value));
  return {
    vehicleName: data.selected_device ? data.selected_device.name : '',
    trips: Number(summary.trips) || 0,
    totalKm: Number(summary.distance) || 0,
    duration: summary.duration || '00:00:00',
    avgSpeed: Number(summary.avg_speed) || 0,
    generatedAt: data.generated_at || '',
    rows: items.map((item, index) => ({
      key: `${item.start_time}-${index}`,
      start: dash(item.start_time),
      end: dash(item.end_time),
      duration: dash(item.duration),
      distance: Number(item.distance) || 0,
      speed: Number(item.speed) || 0,
      from: dash(item.from),
      to: dash(item.to),
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildTripCsv(data) {
  const quote = (text) => `"${String(text).replace(/"/g, '""')}"`;
  const lines = ['SL,Start Time,Stop Time,Duration,Distance (km),Speed (km/h),From,To'];
  data.rows.forEach((row, index) => {
    lines.push(
      [index + 1, row.start, row.end, row.duration, row.distance.toFixed(2), row.speed.toFixed(2), quote(row.from), quote(row.to)].join(','),
    );
  });
  return `Trip Report Details - ${data.vehicleName}\n${lines.join('\n')}`;
}
