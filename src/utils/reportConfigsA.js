// Distance reports: daily, monthly, hourly, trips, speed, location. Real response shapes are in each `parse`.
import { dateBadge, clock12, durationText, formatNumber, hourBadge, placeShort, timeBadge, weekdayName } from './reportFormat';
import { datePart, pagingOf, shareOf, summaryItem, timePart, vehicleField } from './reportShared';
import dayjs from 'dayjs';

export const OVER_SPEED_KMH = 60; // readings above this are shown in red on the Speed report
const rowTone = (km) => (km > 0 ? 'primary' : 'muted');
const sum = (list) => list.reduce((total, value) => total + value, 0);

const timeRangeField = { key: 'times', type: 'timeRange', label: 'Time', width: 'half' };

export const daily = {
  key: 'daily',
  title: 'Daily distance',
  hubSubtitle: "Each day's travel",
  subtitle: 'Distance and driving time for each day',
  icon: 'calendar-today',
  tone: 'primary',
  path: '/reports/distance-report/daily',
  pageSize: 100,
  fields: [vehicleField(), { key: 'from', type: 'dateTime', label: 'From', width: 'half' }, { key: 'to', type: 'dateTime', label: 'To', width: 'half' }],
  defaults: ({ vehicleId, today, weekAgo }) => ({ vehicleId, from: `${weekAgo} 00:00`, to: `${today} 23:59` }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, date_from: f.from, date_to: f.to, limit: size, page }),
  /**
   * { status, items: [{ date_raw: '2026-10-01', km: 70.23, start_time: '08:10:02 AM', end_time: '08:53:58 PM',
   *   duration: 45836, duration_format: '12:43:56' }], pagination, distance_summary: {...} }
   */
  parse: (data) => {
    const items = data.items || [];
    const maxKm = Math.max(0, ...items.map((item) => item.km));
    const active = items.filter((item) => item.km > 0).length;
    const distance = sum(items.map((item) => item.km));
    return {
      summary: [
        summaryItem('Distance', formatNumber(distance, 0), 'km'),
        summaryItem('Active days', active),
        summaryItem('Avg per day', active ? formatNumber(distance / active, 0) : '0', 'km'),
      ],
      rows: items.map((item) => ({
        key: item.date_raw,
        badge: dateBadge(item.date_raw),
        tone: rowTone(item.km),
        title: weekdayName(item.date_raw),
        subtitle: item.km > 0 ? `${clock12(item.start_time)} – ${clock12(item.end_time)}` : 'Parked all day',
        value: `${formatNumber(item.km)} km`,
        valueSub: item.km > 0 ? durationText(item.duration_format) : '',
        progress: shareOf(item.km, maxKm),
      })),
      pagination: pagingOf(data.pagination),
    };
  },
};

export const monthly = {
  key: 'monthly',
  title: 'Monthly distance',
  hubSubtitle: 'Day by day for a month',
  subtitle: 'Every day of the month for one vehicle',
  icon: 'calendar-month',
  tone: 'primary',
  path: '/reports/distance-report/monthly',
  pageSize: 15,
  fields: [vehicleField(false, 'half'), { key: 'month', type: 'month', label: 'Month', width: 'half' }],
  defaults: ({ vehicleId, month }) => ({ vehicleId, month }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, month: f.month, limit: size, page }),
  /**
   * { status, month: '2026-10', days: [1..31], items: [{ device_id, name, days: { '1': 70.23, ... }, total: 507.37 }],
   *   day_totals, fleet_total, pagination }
   */
  parse: (data, filters, today) => {
    const item = (data.items || [])[0];
    const isThisMonth = filters.month === today.slice(0, 7);
    const lastDay = isThisMonth ? Number(today.slice(8, 10)) : 31;
    const days = (data.days || []).filter((day) => day <= lastDay);
    const kmOf = (day) => (item && item.days ? Number(item.days[day]) || 0 : 0);
    const maxKm = Math.max(0, ...days.map(kmOf));
    const active = days.filter((day) => kmOf(day) > 0).length;
    const total = item ? item.total : 0;
    return {
      summary: [
        summaryItem('Distance', formatNumber(total, 0), 'km'),
        summaryItem('Active days', active, `/ ${days.length}`),
        summaryItem('Avg per day', active ? formatNumber(total / active, 0) : '0', 'km'),
      ],
      rows: days.map((day) => {
        const date = `${filters.month}-${String(day).padStart(2, '0')}`;
        return {
          key: date,
          badge: dateBadge(date),
          tone: rowTone(kmOf(day)),
          title: weekdayName(date),
          subtitle: kmOf(day) > 0 ? 'Vehicle was driven' : 'Parked all day',
          value: `${formatNumber(kmOf(day))} km`,
          progress: shareOf(kmOf(day), maxKm),
        };
      }),
      pagination: { page: 1, lastPage: 1, total: days.length },
    };
  },
};

/** "9–10 AM" from { hour_start: '09:00', hour_end: '10:00' }. */
const busiestText = (item) => {
  const to12 = (text) => {
    const hours = Number(text.slice(0, 2));
    return hours % 12 === 0 ? 12 : hours % 12;
  };
  return `${to12(item.hour_start)}–${to12(item.hour_end)}`;
};

export const hourly = {
  key: 'hourly',
  title: 'Hourly distance',
  hubSubtitle: 'Hour by hour',
  subtitle: 'Distance and speed hour by hour',
  icon: 'clock-outline',
  tone: 'primary',
  path: '/reports/distance-report/hourly',
  pageSize: 24,
  fields: [vehicleField(), { key: 'from', type: 'dateTime', label: 'From', width: 'half' }, { key: 'to', type: 'dateTime', label: 'To', width: 'half' }],
  defaults: ({ vehicleId, today }) => ({ vehicleId, from: `${today} 00:00`, to: `${today} 23:59` }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, date_from: f.from, date_to: f.to, limit: size, page }),
  /**
   * { status, sum_km, items: [{ hour: '2026-10-08 08:00:00', date, km, hour_start: '08:00', hour_end: '09:00',
   *   max_speed, min_speed }], totals: { distance, max, min }, summary: { distance, avg_hourly, max_speed }, pagination }
   */
  parse: (data) => {
    const items = data.items || [];
    const maxKm = Math.max(0, ...items.map((item) => item.km));
    const busiest = items.find((item) => item.km === maxKm && maxKm > 0);
    return {
      summary: [
        summaryItem('Distance', formatNumber(data.sum_km ?? 0), 'km'),
        summaryItem('Busiest hour', busiest ? busiestText(busiest) : '-', busiest ? clock12(busiest.hour_start).slice(-2) : ''),
        summaryItem('Top speed', data.summary ? data.summary.max_speed : 0, 'km/h'),
      ],
      rows: items.map((item) => ({
        key: item.hour,
        badge: hourBadge(item.hour_start),
        tone: rowTone(item.km),
        title: `${item.hour_start} – ${item.hour_end}`,
        subtitle: dayjs(item.date).format('DD MMM YYYY'),
        value: `${formatNumber(item.km)} km`,
        valueSub: `max ${item.max_speed} km/h`,
        progress: shareOf(item.km, maxKm),
      })),
      pagination: pagingOf(data.pagination),
    };
  },
};

export const trip = {
  key: 'trip',
  title: 'Trips',
  hubSubtitle: 'Start to stop journeys',
  subtitle: 'Each journey from start to stop',
  icon: 'map-marker-path',
  tone: 'success',
  path: '/reports/distance-report/trip',
  pageSize: 25,
  fields: [vehicleField(), { key: 'from', type: 'dateTime', label: 'From', width: 'half' }, { key: 'to', type: 'dateTime', label: 'To', width: 'half' }],
  defaults: ({ vehicleId, today, weekAgo }) => ({ vehicleId, from: `${weekAgo} 00:00`, to: `${today} 23:59` }),
  buildParams: (f, page, size) => {
    const from = dayjs(f.from);
    const to = dayjs(f.to);
    return {
      device_id: f.vehicleId,
      from_day: from.date(),
      from_month: from.month() + 1,
      from_year: from.year(),
      from_time: timePart(f.from),
      to_day: to.date(),
      to_month: to.month() + 1,
      to_year: to.year(),
      to_time: timePart(f.to),
      limit: size,
      page,
    };
  },
  /**
   * { status, summary: { trips: 55, distance: 289.06, duration: '52:57:01', avg_speed }, pagination,
   *   items: [{ start_time: '2026-10-01 08:11:35', end_time, duration: '00:04:13', distance: 2.07, speed: 28.37 (avg),
   *   from: 'address', to: 'address', from_lat, from_lng, to_lat, to_lng }] }
   */
  parse: (data, filters) => {
    const items = data.items || [];
    const summary = data.summary || {};
    return {
      summary: [
        summaryItem('Trips', summary.trips ?? items.length),
        summaryItem('Distance', formatNumber(summary.distance ?? 0), 'km'),
        summaryItem('Driving', summary.duration ? durationText(summary.duration) : '-'),
      ],
      rows: items.map((item) => ({
        key: `${item.start_time}`,
        badge: dateBadge(item.start_time),
        tone: 'primary',
        title: `${placeShort(item.from).split(',')[0]} → ${placeShort(item.to).split(',')[0]}`,
        subtitle: `${clock12(item.start_time)} – ${clock12(item.end_time)} · ${durationText(item.duration)} driving`,
        value: `${formatNumber(item.distance)} km`,
        valueSub: `avg ${Math.round(item.speed)} km/h`,
        action: {
          type: 'playback',
          vehicleId: filters.vehicleId,
          range: {
            fromDate: datePart(item.start_time),
            toDate: datePart(item.end_time),
            fromTime: timePart(item.start_time),
            toTime: timePart(item.end_time),
          },
        },
      })),
      pagination: pagingOf(data.pagination),
    };
  },
};

export const speed = {
  key: 'speed',
  title: 'Speed',
  hubSubtitle: 'Speed through the day',
  subtitle: 'Speed readings through the day',
  icon: 'speedometer',
  tone: 'danger',
  path: '/reports/distance-report/speed',
  pageSize: 15,
  fields: [vehicleField(), { key: 'date', type: 'date', label: 'Date', width: 'half' }, timeRangeField],
  defaults: ({ vehicleId, today }) => ({ vehicleId, date: today, times: { from: '00:00', to: '23:59' } }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, date: f.date, from_time: f.times.from, to_time: f.times.to, limit: size, page }),
  /**
   * { status, chart: { labels: ['08:44'...], max: [..], avg: [..], min: [..] },
   *   items: [{ time: '08:44', max_speed, avg_speed, min_speed }], speed_summary: { max_speed, min_speed, avg_speed }, pagination }
   */
  parse: (data) => {
    const items = data.items || [];
    const summary = data.speed_summary || {};
    const topSpeed = summary.max_speed || 0;
    const overCount = ((data.chart && data.chart.max) || []).filter((value) => value > OVER_SPEED_KMH).length;
    return {
      summary: [
        summaryItem('Top speed', Math.round(topSpeed), 'km/h'),
        summaryItem('Average', Math.round(summary.avg_speed || 0), 'km/h'),
        summaryItem(`Over ${OVER_SPEED_KMH}`, overCount, 'times'),
      ],
      rows: items.map((item) => ({
        key: item.time,
        badge: timeBadge(item.time),
        tone: item.max_speed > OVER_SPEED_KMH ? 'danger' : 'primary',
        title: `Top ${Math.round(item.max_speed)} km/h`,
        subtitle: `Average ${Math.round(item.avg_speed)} · lowest ${Math.round(item.min_speed)} km/h`,
        value: `${Math.round(item.max_speed)} km/h`,
        valueSub: item.max_speed > OVER_SPEED_KMH ? `over ${OVER_SPEED_KMH}` : '',
        valueTone: item.max_speed > OVER_SPEED_KMH ? 'danger' : undefined,
        progress: shareOf(item.max_speed, topSpeed),
      })),
      pagination: pagingOf(data.pagination),
    };
  },
};

const movingLabel = (kmh) => {
  if (kmh <= 1) {
    return { text: 'Stopped', tone: 'warning' };
  }
  if (kmh < 15) {
    return { text: 'Slowing', tone: 'success' };
  }
  return { text: 'Moving', tone: 'success' };
};

export const location = {
  key: 'location',
  title: 'Location',
  hubSubtitle: 'Point-by-point positions',
  subtitle: 'Where the vehicle was, point by point',
  icon: 'map-marker-outline',
  tone: 'success',
  path: '/reports/distance-report/location',
  pageSize: 15,
  fields: [vehicleField(), { key: 'date', type: 'date', label: 'Date', width: 'half' }, timeRangeField],
  defaults: ({ vehicleId, today }) => ({ vehicleId, date: today, times: { from: '00:00', to: '23:59' } }),
  buildParams: (f, page, size) => ({ device_id: f.vehicleId, date: f.date, from_time: f.times.from, to_time: f.times.to, limit: size, page }),
  /**
   * { status, items: [{ vehicle, date, clock_time: '08:44:04', device_time, latitude, longitude, nearby: 'address',
   *   speed, map_url: 'https://maps.google.com/?q=..' }], pagination }
   */
  parse: (data) => {
    const items = data.items || [];
    const places = new Set(items.map((item) => placeShort(item.nearby)));
    const fastest = Math.max(0, ...items.map((item) => item.speed));
    return {
      summary: [
        summaryItem('Points', data.pagination ? data.pagination.total : items.length),
        summaryItem('Top speed', Math.round(fastest), 'km/h'),
        summaryItem('Places', places.size),
      ],
      rows: items.map((item, index) => {
        const label = movingLabel(item.speed);
        return {
          key: `${item.date}-${item.clock_time}-${index}`,
          badge: timeBadge(item.clock_time),
          tone: label.tone,
          title: placeShort(item.nearby),
          subtitle: `${Number(item.latitude).toFixed(4)}, ${Number(item.longitude).toFixed(4)}`,
          value: `${Math.round(item.speed)} km/h`,
          valueSub: label.text,
          action: { type: 'url', url: item.map_url },
        };
      }),
      pagination: pagingOf(data.pagination),
    };
  },
};
