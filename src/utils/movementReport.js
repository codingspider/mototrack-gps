// Movement summary report (the web "Movement Summary Details"): how an answer of
// GET /reports/distance-report/movement-summary becomes screen data, and the CSV text. Pure functions.
import dayjs from 'dayjs';

/** "2026-10-12 00:19:51" -> "00:19:51"; "2026-10-12 00:19" -> "00:19"; '-' when there is no time. */
export function clockText(text) {
  const match = String(text || '').match(/(\d{1,2}:\d{2}(?::\d{2})?)\s*$/);
  return match ? match[1] : '-';
}

/**
 * { success, response: { data: [{ vehicle_name, vrn, date: '2026-10-12', start_time: '2026-10-12 00:19:51',
 *   end_time, duration: '15:02:17', max_speed: 62, avg_speed: 25.79, distance: 40.8, system_distance: 38.47,
 *   trips: 6, move_type: 'Moving' | 'Idle' | 'Stopped' | 'No Data', start_landmark }],
 *   summary: { vehicles, trips, distance, operating_time: '04:31:00' }, generated_at, pagination } }
 */
export function parseMovementReport(data) {
  const body = data.response || data;
  const items = body.data || [];
  const summary = body.summary || {};
  const pagination = body.pagination || {};
  const dash = (value) => (value === null || value === undefined || value === '' ? '-' : String(value));
  const number = (value) => (value === null || value === undefined || value === '-' ? null : Number(value));
  return {
    vehicles: summary.vehicles ?? items.length,
    trips: Number(summary.trips) || 0,
    totalKm: Number(summary.distance) || 0,
    operatingTime: summary.operating_time || '00:00:00',
    generatedAt: body.generated_at || '',
    rows: items.map((item, index) => {
      const date = dayjs(item.date);
      return {
        key: `${item.vehicle_name}-${item.date}-${index}`,
        vehicle: dash(item.vehicle_name || item.bst_id),
        vrn: dash(item.vrn),
        date: date.isValid() ? date.format('DD MMM YYYY') : dash(item.date),
        month: date.isValid() ? date.format('MMMM') : '-',
        year: date.isValid() ? date.format('YYYY') : '-',
        start: clockText(item.start_time),
        end: clockText(item.end_time),
        duration: dash(item.duration),
        distance: number(item.distance),
        systemDistance: number(item.system_distance),
        maxSpeed: number(item.max_speed),
        avgSpeed: number(item.avg_speed),
        trips: Number(item.trips) || 0,
        moveType: dash(item.move_type),
        landmark: dash(item.start_landmark),
      };
    }),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** A number cell: two decimals, or "-" when the vehicle has no data that day. */
export function numberCell(value, hasData = true) {
  return value === null || value === undefined || !hasData ? '-' : Number(value).toFixed(2);
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildMovementCsv(data) {
  const lines = [
    'SL,Vehicle,VRN,Date,Month,Year,Start Time,End Time,Duration,Distance (km),System Distance (km),Max Speed (km/h),Avg Speed (km/h),Trips,Move Type,Start Landmark',
  ];
  const quote = (text) => `"${String(text).replace(/"/g, '""')}"`;
  data.rows.forEach((row, index) => {
    const hasData = row.moveType !== 'No Data';
    lines.push(
      [
        index + 1,
        quote(row.vehicle),
        quote(row.vrn),
        quote(row.date),
        row.month,
        row.year,
        row.start,
        row.end,
        row.duration,
        numberCell(row.distance, hasData),
        numberCell(row.systemDistance, hasData),
        numberCell(row.maxSpeed, hasData),
        numberCell(row.avgSpeed, hasData),
        row.trips,
        row.moveType,
        quote(row.landmark),
      ].join(','),
    );
  });
  return `Movement Summary Details\n${lines.join('\n')}`;
}
