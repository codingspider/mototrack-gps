// Vehicle activity report (the web "Vehicle Activity Details"): how an answer of
// GET /reports/distance-report/activity becomes screen data, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/** "2026-10-12 08:45:11" -> "12 Oct, 08:45 AM"; '-' when there is no time. */
export function activityTime(text) {
  if (!text) {
    return '-';
  }
  const date = dayjs(String(text).replace(' ', 'T'));
  return date.isValid() ? date.format('DD MMM, hh:mm A') : '-';
}

/**
 * { success, response: { data: [{ customer, bstid: 'vehicle name', vrn: 'plate', start_time: '2026-10-12 08:45:11',
 *   end_time, duration: '00:50:33', distance: 19.14, overspeed, trips: 4, trip_duration: 0.84, earliest_landmark,
 *   latest_landmark }], summary: { vehicles, trips, distance, stop_time: '05:10:37' }, generated_at, pagination } }
 */
export function parseActivityReport(data) {
  const body = data.response || data;
  const items = body.data || [];
  const summary = body.summary || {};
  const pagination = body.pagination || {};
  const dash = (value) => (value === null || value === undefined || value === '' ? '-' : String(value));
  return {
    vehicles: summary.vehicles ?? items.length,
    trips: Number(summary.trips) || 0,
    totalKm: Number(summary.distance) || 0,
    stopTime: summary.stop_time || '00:00:00',
    generatedAt: body.generated_at || '',
    rows: items.map((item, index) => {
      const moved = !!item.start_time;
      return {
        key: `${item.bstid}-${index}`,
        vehicle: dash(item.bstid),
        customer: dash(item.customer),
        vrn: dash(item.vrn),
        start: activityTime(item.start_time),
        end: activityTime(item.end_time),
        duration: dash(item.duration),
        distance: moved && item.distance !== null && item.distance !== undefined ? `${Number(item.distance).toFixed(2)} KM` : '-',
        overspeed: dash(item.overspeed),
        trips: Number(item.trips) || 0,
        tripDuration: moved && item.trip_duration !== null && item.trip_duration !== undefined ? `${Number(item.trip_duration).toFixed(2)} Hours` : '-',
        landmark: dash(item.earliest_landmark),
      };
    }),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildActivityCsv(data) {
  const lines = ['SL,Vehicle,Customer,VRN,Start Time,End Time,Duration,Distance,Overspeed,Trips,Trip Duration,Earliest Landmark'];
  const quote = (text) => `"${String(text).replace(/"/g, '""')}"`;
  data.rows.forEach((row, index) => {
    lines.push(
      [
        index + 1,
        quote(row.vehicle),
        quote(row.customer),
        quote(row.vrn),
        quote(row.start),
        quote(row.end),
        row.duration,
        row.distance,
        row.overspeed,
        row.trips,
        row.tripDuration,
        quote(row.landmark),
      ].join(','),
    );
  });
  return `Vehicle Activity Details\n${lines.join('\n')}`;
}
