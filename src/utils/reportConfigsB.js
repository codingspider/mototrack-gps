// Fleet reports: last location, vehicle activity, movement summary, engine, fuel, payments, overspeed alerts.
import dayjs from 'dayjs';
import { formatTimeAgo } from './formatDate';
import { formatDuration } from './playbackStats';
import { clock12, dateBadge, durationText, formatNumber, placeShort, timeBadge, weekdayName } from './reportFormat';
import { bdTextToUnix, bodyOf, datePart, pagingOf, shareOf, summaryItem, timePart, vehicleField } from './reportShared';

const MIN_DISTANCE_OPTIONS = [1, 5, 10, 20].map((km) => ({ value: km, label: `${km} km` }));
const SPEED_LIMIT_OPTIONS = [40, 50, 60, 80, 100].map((kmh) => ({ value: kmh, label: `${kmh} km/h` }));

const capitalize = (text) => (text ? text.charAt(0).toUpperCase() + text.slice(1) : '-');
const mapUrl = (lat, lng) => `https://maps.google.com/?q=${lat},${lng}`;

export const lastlocation = {
  key: 'lastlocation',
  title: 'Last location',
  hubSubtitle: 'Latest fix per vehicle',
  subtitle: 'Latest position of every vehicle',
  icon: 'crosshairs-gps',
  tone: 'primary',
  path: '/reports/distance-report/lastlocation',
  pageSize: 100,
  fields: [vehicleField(true)],
  // Starts with one vehicle: asking the server for "All vehicles" currently fails with a 500 "Whoops" page (backend issue,
  // see CLAUDE.md). The All vehicles choice stays in the list for when the server is fixed.
  defaults: ({ vehicleId }) => ({ vehicleId }),
  buildParams: (f, page, size) => ({ ...(f.vehicleId === 'all' ? {} : { device_id: f.vehicleId }), limit: size, page }),
  /**
   * { success, message, response: { data: [{ vehicle, plate_number, customer, model, status: 'online'|'offline'|...,
   *   last_loc_time: '2026-10-08 12:22:46' (Bangladesh time), nearby: 'address', latitude, longitude }], pagination } }
   */
  parse: (data, filters, today) => {
    const body = bodyOf(data);
    const items = body.data || [];
    const online = items.filter((item) => item.status === 'online').length;
    return {
      summary: [
        summaryItem('Vehicles', body.pagination ? body.pagination.total : items.length),
        summaryItem('Online', online),
        summaryItem('Offline', items.length - online),
      ],
      rows: items.map((item, index) => {
        const isToday = datePart(item.last_loc_time) === today;
        const isOnline = item.status === 'online';
        return {
          key: `${item.vehicle}-${index}`,
          badge: isToday ? timeBadge(item.last_loc_time) : dateBadge(item.last_loc_time),
          tone: isOnline ? 'success' : 'muted',
          title: item.vehicle,
          subtitle: `${placeShort(item.nearby)} · ${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`,
          value: capitalize(item.status),
          valueSub: formatTimeAgo(bdTextToUnix(item.last_loc_time)),
          valueTone: isOnline ? 'success' : 'muted',
          action: { type: 'url', url: mapUrl(item.latitude, item.longitude) },
        };
      }),
      pagination: pagingOf(body.pagination),
    };
  },
};

export const activity = {
  key: 'activity',
  title: 'Vehicle activity',
  hubSubtitle: 'Moving and stopped',
  subtitle: 'When it moved and when it stopped',
  icon: 'pulse',
  tone: 'primary',
  path: '/reports/distance-report/activity',
  pageSize: 15,
  fields: [
    vehicleField(true),
    { key: 'from', type: 'date', label: 'From', width: 'half' },
    { key: 'to', type: 'date', label: 'To', width: 'half' },
    { key: 'minDistance', type: 'select', label: 'Min distance', width: 'half', options: MIN_DISTANCE_OPTIONS },
  ],
  defaults: ({ today }) => ({ vehicleId: 'all', from: today, to: today, minDistance: 1 }),
  buildParams: (f, page, size) => ({
    ...(f.vehicleId === 'all' ? {} : { device_id: f.vehicleId }),
    min_distance: f.minDistance,
    from_date: f.from,
    to_date: f.to,
    limit: size,
    page,
  }),
  /**
   * { success, response: { data: [{ bstid: 'vehicle name', start_time: '2026-10-08 08:46:04', end_time, duration: '00:45:42',
   *   distance: 25.17, overspeed, trips: 3, earliest_landmark, latest_landmark, last_seen }],
   *   summary: { vehicles, trips, distance, stop_seconds, stop_time: '00:18:23' }, pagination } }
   */
  parse: (data) => {
    const body = bodyOf(data);
    // A vehicle that did not move has no start time: leave it out instead of showing an empty row
    const items = (body.data || []).filter((item) => !!item.start_time);
    const summary = body.summary || {};
    const maxKm = Math.max(0, ...items.map((item) => item.distance));
    return {
      summary: [
        summaryItem('Distance', formatNumber(summary.distance ?? 0), 'km'),
        summaryItem('Trips', summary.trips ?? 0),
        summaryItem('Stopped', summary.stop_time ? durationText(summary.stop_time) : '-'),
      ],
      rows: items.map((item, index) => ({
        key: `${item.bstid}-${index}`,
        badge: timeBadge(item.start_time),
        tone: item.distance > 0 ? 'success' : 'warning',
        title: item.bstid || 'Vehicle',
        subtitle: `${clock12(item.start_time)} – ${clock12(item.end_time)} · ${durationText(item.duration)}`,
        value: `${formatNumber(item.distance)} km`,
        valueSub: `${item.trips} ${item.trips === 1 ? 'trip' : 'trips'}`,
        progress: shareOf(item.distance, maxKm),
      })),
      pagination: pagingOf(body.pagination),
    };
  },
};

export const movement = {
  key: 'movement',
  title: 'Movement summary',
  hubSubtitle: 'Monthly fleet totals',
  subtitle: 'Monthly totals for your vehicles',
  icon: 'chart-bar',
  tone: 'primary',
  path: '/reports/distance-report/movement-summary',
  pageSize: 25,
  fields: [{ key: 'month', type: 'month', label: 'Month', width: 'half' }, vehicleField(true, 'half')],
  defaults: ({ month }) => ({ month, vehicleId: 'all' }),
  buildParams: (f, page, size) => ({ month: f.month, ...(f.vehicleId === 'all' ? {} : { device_id: f.vehicleId }), limit: size, page }),
  /**
   * { success, response: { data: [{ vehicle_name, date: '2026-10-01', start_time: '2026-10-01 08:10', end_time, duration,
   *   max_speed, avg_speed, distance: 70.23, system_distance, trips: 28, move_type: 'Moving' }],
   *   summary: { vehicles, trips, distance, operating_seconds, operating_time: '58:12:42' }, pagination } }
   */
  parse: (data) => {
    const body = bodyOf(data);
    const items = body.data || [];
    const summary = body.summary || {};
    const maxKm = Math.max(0, ...items.map((item) => item.distance));
    return {
      summary: [
        summaryItem('Fleet distance', formatNumber(summary.distance ?? 0, 0), 'km'),
        summaryItem('Trips', summary.trips ?? 0),
        summaryItem('Operating', formatDuration(summary.operating_seconds || 0)),
      ],
      rows: items.map((item, index) => ({
        key: `${item.vehicle_name}-${item.date}-${index}`,
        badge: dateBadge(item.date),
        tone: 'primary',
        title: item.vehicle_name,
        subtitle: `${weekdayName(item.date)} · ${clock12(item.start_time)} – ${clock12(item.end_time)} · ${item.trips} trips`,
        value: `${formatNumber(item.distance)} km`,
        valueSub: `max ${Math.round(item.max_speed)} km/h`,
        progress: shareOf(item.distance, maxKm),
      })),
      pagination: pagingOf(body.pagination),
    };
  },
};

const ENGINE_TONES = { On: 'success', Off: 'muted', Idle: 'warning' };
const ENGINE_OPTIONS = [
  { value: 'all', label: 'On & off' },
  { value: 'On', label: 'Engine on' },
  { value: 'Off', label: 'Engine off' },
  { value: 'Idle', label: 'Idling' },
];

export const engine = {
  key: 'engine',
  title: 'Engine',
  hubSubtitle: 'On / off sessions',
  subtitle: 'Engine on and off sessions',
  icon: 'power',
  tone: 'warning',
  path: '/reports/distance-report/engine/report',
  pageSize: 30,
  fields: [
    vehicleField(),
    { key: 'date', type: 'date', label: 'Date', width: 'half' },
    { key: 'status', type: 'select', label: 'Status', width: 'half', options: ENGINE_OPTIONS },
  ],
  defaults: ({ vehicleId, today }) => ({ vehicleId, date: today, status: 'all' }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, date: f.date, limit: size, page }),
  /**
   * { status, totals: { on: '00:46:12', off: '11:32:39', idle: '00:03:57' }, events: 8, pagination,
   *   items: [{ vehicle, status: 'On'|'Off'|'Idle', from: '08 Oct 2026 00:00:00', to, duration: '08:44:02' }] }
   * The status choice is applied here, on the rows that were loaded.
   */
  parse: (data, filters) => {
    const all = data.items || [];
    const items = filters.status === 'all' ? all : all.filter((item) => item.status === filters.status);
    const totals = data.totals || {};
    return {
      summary: [
        summaryItem('Engine on', totals.on ? durationText(totals.on) : '-'),
        summaryItem('Sessions', data.pagination ? data.pagination.total : all.length),
        summaryItem('Idling', totals.idle ? durationText(totals.idle) : '-'),
      ],
      rows: items.map((item, index) => ({
        key: `${item.from}-${index}`,
        badge: timeBadge(item.from),
        tone: ENGINE_TONES[item.status] || 'muted',
        title: item.status === 'Idle' ? 'Engine idling' : `Engine ${String(item.status).toLowerCase()}`,
        subtitle: `${clock12(item.from)} – ${clock12(item.to)}`,
        value: durationText(item.duration),
      })),
      pagination: pagingOf(data.pagination),
    };
  },
};

export const fuel = {
  key: 'fuel',
  title: 'Fuel',
  hubSubtitle: 'Usage and mileage',
  subtitle: 'Fuel used and mileage for all vehicles',
  icon: 'gas-station-outline',
  tone: 'warning',
  path: '/reports/fuel-report',
  pageSize: 25,
  fields: [{ key: 'from', type: 'dateTime', label: 'From', width: 'half' }, { key: 'to', type: 'dateTime', label: 'To', width: 'half' }],
  defaults: ({ today, weekAgo }) => ({ from: `${weekAgo} 00:00`, to: `${today} 23:59` }),
  buildParams: (f, page, size) => ({ date_from: f.from, date_to: f.to, per_page: size, page }),
  /**
   * { success, response: { data: [], totals: { vehicles, distance_km, fuel_consumed, fuel_filled, fuel_drained,
   *   fillings_count, drains_count, fuel_cost }, pagination, filters: { only_with_sensor: true } } }
   * Only vehicles with a fuel sensor are listed. The fields of one vehicle row have not been seen yet (none of this
   * account's vehicles has a fuel sensor), so rows are not built; the totals and the empty message are.
   */
  parse: (data) => {
    const body = bodyOf(data);
    const totals = body.totals || {};
    const used = Number(totals.fuel_consumed) || 0;
    const distance = Number(totals.distance_km) || 0;
    const hasData = (body.data || []).length > 0;
    return {
      summary: [
        summaryItem('Fuel used', formatNumber(used), 'L'),
        summaryItem('Distance', formatNumber(distance, 0), 'km'),
        summaryItem('Mileage', used > 0 ? formatNumber(distance / used) : '-', used > 0 ? 'km/L' : ''),
      ],
      rows: [],
      note: hasData ? '' : 'No vehicle with a fuel sensor reported fuel in this time.',
      pagination: pagingOf(body.pagination),
    };
  },
};

const PAYMENT_OPTIONS = [
  { value: 'all', label: 'All payments' },
  { value: 'paid', label: 'Paid' },
  { value: 'due', label: 'Due' },
  { value: 'expired', label: 'Expired' },
];

const paymentState = (item) => {
  if (item.is_expired) {
    return { text: 'Expired', tone: 'danger' };
  }
  if (item.payment_status === 'paid') {
    return { text: 'Paid', tone: 'success' };
  }
  // The server's own words, written for people: "expiring_soon" -> "Expiring soon"
  const words = capitalize(String(item.payment_status || 'due').replace(/_/g, ' '));
  return { text: words, tone: item.is_expiring_soon ? 'warning' : 'danger' };
};

export const payment = {
  key: 'payment',
  title: 'Payments',
  hubSubtitle: 'Renewal history',
  subtitle: 'Every renewal paid with DGePay',
  icon: 'credit-card-outline',
  tone: 'danger',
  path: '/reports/payment-report',
  pageSize: 100,
  fields: [{ key: 'show', type: 'select', label: 'Show', width: 'full', options: PAYMENT_OPTIONS }],
  defaults: () => ({ show: 'all' }),
  buildParams: (f, page, size) => ({ per_page: size, page }),
  /**
   * { status, totals: { paid_amount: 1500, due_amount: 1800 }, pagination,
   *   items: [{ device_id, name, customer_name, expiration_date, payment_status: 'due'|'paid', last_payment (date or null),
   *   amount (or null), is_expired, is_expiring_soon }] }
   * The Show choice is applied here, on the loaded rows.
   */
  parse: (data, filters) => {
    const all = data.items || [];
    const items = all.filter((item) => {
      if (filters.show === 'all') {
        return true;
      }
      if (filters.show === 'expired') {
        return item.is_expired;
      }
      return !item.is_expired && (filters.show === 'paid' ? item.payment_status === 'paid' : item.payment_status !== 'paid');
    });
    const totals = data.totals || {};
    return {
      summary: [
        summaryItem('Paid', `৳ ${formatNumber(totals.paid_amount ?? 0, 0)}`),
        summaryItem('Due', `৳ ${formatNumber(totals.due_amount ?? 0, 0)}`),
        summaryItem('Vehicles', data.pagination ? data.pagination.total : all.length),
      ],
      rows: items.map((item) => {
        const state = paymentState(item);
        return {
          key: String(item.device_id),
          // Never paid: show the taka sign instead of an empty date
          badge: item.last_payment ? dateBadge(item.last_payment) : { top: '৳', bottom: '' },
          tone: state.tone,
          title: item.name,
          subtitle: item.expiration_date ? `Expires ${dayjs(datePart(item.expiration_date)).format('DD MMM YYYY')}` : 'No expiry date set',
          value: item.amount ? `৳ ${formatNumber(item.amount, 0)}` : '-',
          valueSub: state.text,
          valueTone: state.tone,
        };
      }),
      pagination: pagingOf(data.pagination),
    };
  },
};

export const overspeed = {
  key: 'overspeed',
  title: 'Overspeed alerts',
  hubSubtitle: 'Above your limit',
  subtitle: 'Times the vehicle went above the limit',
  icon: 'alert-outline',
  tone: 'danger',
  path: '/get_overspeed_alerts',
  pageSize: 0,
  fields: [
    vehicleField(),
    { key: 'from', type: 'dateTime', label: 'From', width: 'half' },
    { key: 'to', type: 'dateTime', label: 'To', width: 'half' },
    { key: 'limit', type: 'select', label: 'Speed limit', width: 'half', options: SPEED_LIMIT_OPTIONS },
  ],
  defaults: ({ vehicleId, today, weekAgo }) => ({ vehicleId, from: `${weekAgo} 00:00`, to: `${today} 23:59`, limit: 60 }),
  buildParams: (f) => ({
    device_id: f.vehicleId,
    from_date: datePart(f.from),
    to_date: datePart(f.to),
    from_time: timePart(f.from),
    to_time: timePart(f.to),
    skip_invalid: 1,
    speed_threshold: f.limit,
  }),
  /**
   * { status, device: { id, name }, range, count: 28, total: 28, truncated: true, limit: 5000,
   *   alerts: [{ id, time: '2026-10-02 17:57:16' (Bangladesh time), timestamp, lat, lng, speed: 53, threshold: 50 }] }
   */
  parse: (data, filters) => {
    const alerts = [...(data.alerts || [])].sort((a, b) => b.timestamp - a.timestamp);
    const top = Math.max(0, ...alerts.map((alert) => alert.speed));
    return {
      summary: [
        summaryItem('Alerts', data.total ?? alerts.length),
        summaryItem('Top speed', Math.round(top), 'km/h'),
        summaryItem('Limit', filters.limit, 'km/h'),
      ],
      rows: alerts.map((alert) => ({
        key: String(alert.id),
        badge: { top: String(Math.round(alert.speed)), bottom: 'km/h' },
        tone: 'danger',
        title: `${Math.round(alert.speed - filters.limit)} km/h over the limit`,
        subtitle: `${dayjs(datePart(alert.time)).format('DD MMM YYYY')}, ${clock12(alert.time)}`,
        value: '',
        action: { type: 'url', url: mapUrl(alert.lat, alert.lng) },
      })),
      note: data.truncated ? 'Too many alerts for this range: showing the first part. Pick a shorter time.' : '',
      pagination: { page: 1, lastPage: 1, total: alerts.length },
    };
  },
};
