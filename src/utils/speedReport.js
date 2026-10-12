// Speed report (the web "Speed Report Details"): how an answer of GET /reports/distance-report/speed becomes
// screen data, the chart helpers and the CSV text. Pure functions.

/**
 * The chart lines. A newer answer has `datasets` (one line per vehicle). An older one has `max`, `avg` and `min`
 * lists of one vehicle, which become three lines.
 */
export function chartDatasets(chart) {
  if (chart && Array.isArray(chart.datasets) && chart.datasets.length > 0) {
    return chart.datasets;
  }
  const lines = [
    ['Maximum', chart && chart.max],
    ['Average', chart && chart.avg],
    ['Minimum', chart && chart.min],
  ];
  return lines.filter(([, data]) => Array.isArray(data) && data.length > 0).map(([label, data]) => ({ label, data }));
}

/**
 * {
 *   status: 1, date: '2026-10-12', to_date: '2026-10-12', bucket_label: '1 minute', generated_at: '12 Oct 2026 20:38',
 *   selected_device: { id, name } | null,
 *   chart: { labels: ['00:19', ...], datasets: [{ label: 'Bogura LA 15-4717', data: [0, 27, null, ...] }] },
 *   items: [{ vehicle, date, start_time, end_time, latitude, longitude, max_speed, avg_speed, min_speed, map_url }],
 *   speed_summary: { max_speed: 62, min_speed: 0, avg_speed: 23.21 } | null,
 *   pagination: { current_page, per_page, total, last_page }
 * }
 */
export function parseSpeedReport(data) {
  const summary = data.speed_summary || {};
  const items = data.items || [];
  const chart = data.chart || {};
  const pagination = data.pagination || {};
  const sameDay = !data.to_date || data.to_date === data.date;
  // An older server answer has no vehicle or date on the rows: use the selected vehicle and the asked date
  const fallbackVehicle = data.selected_device ? data.selected_device.name : '';
  return {
    maxSpeed: Number(summary.max_speed) || 0,
    minSpeed: Number(summary.min_speed) || 0,
    avgSpeed: Number(summary.avg_speed) || 0,
    hasData: !!data.speed_summary,
    // "All vehicles · 2026-10-12" under each speed box
    scope: `${data.selected_device ? data.selected_device.name : 'All vehicles'} · ${
      sameDay ? data.date : `${data.date} – ${data.to_date}`
    }`,
    bucketLabel: data.bucket_label || '',
    generatedAt: data.generated_at || '',
    chart: { labels: chart.labels || [], datasets: chartDatasets(chart) },
    rows: items.map((item, index) => ({
      key: `${item.vehicle || fallbackVehicle}-${item.date || data.date}-${item.start_time || item.time}-${index}`,
      vehicle: item.vehicle || fallbackVehicle || '-',
      date: item.date || data.date || '-',
      start: item.start_time || item.time || '-',
      end: item.end_time || item.start_time || item.time || '-',
      latitude: item.latitude === null || item.latitude === undefined ? null : Number(item.latitude),
      longitude: item.longitude === null || item.longitude === undefined ? null : Number(item.longitude),
      max: Number(item.max_speed) || 0,
      avg: Number(item.avg_speed) || 0,
      min: Number(item.min_speed) || 0,
    })),
    page: pagination.current_page || 1,
    lastPage: pagination.last_page || 1,
    total: pagination.total ?? items.length,
  };
}

/** A round top for the chart's speed axis: 62 -> 70, 0 -> 10. */
export function niceMax(value) {
  return Math.max(10, Math.ceil((Number(value) || 0) / 10) * 10);
}

/**
 * Runs of consecutive readings of one line, so a gap (null) breaks the line instead of joining over it.
 * @param {Array<number|null>} values
 * @returns {Array<Array<{ index: number, value: number }>>}
 */
export function buildSegments(values) {
  const segments = [];
  let current = [];
  values.forEach((value, index) => {
    if (value === null || value === undefined) {
      if (current.length) {
        segments.push(current);
        current = [];
      }
      return;
    }
    current.push({ index, value: Number(value) });
  });
  if (current.length) {
    segments.push(current);
  }
  return segments;
}

/** Which of `count` x-axis labels to show: about `wanted` evenly spaced indexes, first and last included. */
export function tickIndexes(count, wanted = 5) {
  if (count <= 0) {
    return [];
  }
  if (count <= wanted) {
    return Array.from({ length: count }, (_, index) => index);
  }
  const indexes = new Set();
  for (let step = 0; step < wanted; step += 1) {
    indexes.add(Math.round((step * (count - 1)) / (wanted - 1)));
  }
  return [...indexes];
}

/** The loaded rows as CSV text (shared from the phone, like the web "Export"). */
export function buildSpeedCsv(data) {
  const lines = ['SL,Vehicle,Date,Time (Start),Time (End),Latitude,Longitude,Max Speed (km/h),Avg Speed (km/h),Min Speed (km/h)'];
  data.rows.forEach((row, index) => {
    const lat = row.latitude === null ? '' : row.latitude.toFixed(6);
    const lng = row.longitude === null ? '' : row.longitude.toFixed(6);
    lines.push(
      [index + 1, `"${row.vehicle}"`, row.date, row.start, row.end, lat, lng, row.max.toFixed(2), row.avg.toFixed(2), row.min.toFixed(2)].join(','),
    );
  });
  return `Speed Report Details\n${lines.join('\n')}`;
}
