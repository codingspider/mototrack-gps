// The tables of the reports as plain data, for the PDF / Excel / CSV files the server makes (POST /report-export).
// Every builder returns { title, subtitle, generatedAt, summary: [{ label, value }], columns: [text], rows: [[text]] }.
// All cells are text. Pure functions: one builder for each report, next to the parsed data it reads.
import { sinceLabel } from './dailyActivity';
import { litresText } from './fuelAlertReport';
import { kmCell } from './monthlyOverview';
import { numberCell } from './movementReport';

/** The server accepts at most this many rows in one file (the same number as ReportExportController::MAX_ROWS). */
export const MAX_EXPORT_ROWS = 5000;

const two = (value) => Number(value || 0).toFixed(2);
const km = (value) => `${two(value)} km`;
const speed = (value) => `${two(value)} km/h`;

/** SL numbers in front of each row. */
const withSerial = (rows) => rows.map((row, index) => [String(index + 1), ...row]);

/** Daily activity (GET /reports/distance-report/daily). */
export function buildDailyExport(data, subtitle = '') {
  return {
    title: 'Daily Activity',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Vehicle', value: data.vehicleName || '-' },
      {
        label: 'Report period',
        value: `${data.periodDays} ${data.periodDays === 1 ? 'day' : 'days'}`,
      },
      { label: 'Total KM (selected period)', value: km(data.totalKm) },
      { label: "Today's KM", value: km(data.todayKm) },
      {
        label: data.sinceDate ? `Total KM since GPS installed (${sinceLabel(data.sinceDate)})` : 'Total KM since GPS installed',
        value: km(data.sinceKm),
      },
    ],
    columns: ['SL', 'Date', 'KM', 'Start Time', 'End Time', 'Duration'],
    rows: withSerial(data.rows.map((row) => [row.date, two(row.km), row.start, row.end, row.duration])),
  };
}

/** Monthly distance overview: one column for each day of the period, and a Total row. */
export function buildMonthlyExport(data, subtitle = '') {
  const rows = withSerial(
    data.rows.map((row) => [row.name, row.plate, two(row.total), ...data.dates.map((date) => kmCell(row.byDate[date.key]))]),
  );
  rows.push(['', 'Total', '', two(data.fleetTotal), ...data.dateTotals.map((value) => kmCell(value))]);
  return {
    title: 'Monthly Distance Overview',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Reporting period', value: data.periodLabel || '-' },
      { label: 'Vehicles', value: String(data.vehiclesCount) },
      { label: 'Distance unit', value: data.unit },
    ],
    columns: ['SL', 'Vehicle', 'Plate Number', `Total (${data.unit})`, ...data.dates.map((date) => date.label)],
    rows,
  };
}

/** Hourly report details, with a Total row. */
export function buildHourlyExport(data, subtitle = '') {
  const rows = withSerial(data.rows.map((row) => [row.date, two(row.km), row.start, row.end, two(row.max), two(row.min)]));
  rows.push(['', 'Total', two(data.totalKm), '', '', '', '']);
  return {
    title: 'Hourly Report Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Vehicles', value: String(data.vehicles) },
      { label: 'Total KM', value: km(data.totalKm) },
      { label: 'Avg. Hourly Distance', value: km(data.avgHourly) },
      { label: 'Operating Hours', value: data.operating || '-' },
      { label: 'Max Speed', value: speed(data.maxSpeed) },
    ],
    columns: ['Sl.', 'Date', 'Distance (km)', 'Hour Start', 'Hour End', 'Max Speed (km/h)', 'Min Speed (km/h)'],
    rows,
  };
}

const coordinate = (value) => (value === null || value === undefined ? '-' : Number(value).toFixed(6));

/** Location report details. */
export function buildLocationExport(data, subtitle = '') {
  return {
    title: 'Location Report Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Vehicles', value: String(data.vehicles) },
      { label: 'Total KM', value: km(data.totalKm) },
      { label: 'Avg. Speed', value: speed(data.avgSpeed) },
      { label: 'Operating Hours', value: data.operating || '-' },
      { label: 'Max Speed', value: speed(data.maxSpeed) },
    ],
    columns: ['Sl.', 'Vehicle', 'Date', 'Time (Start)', 'Time (End)', 'Latitude', 'Longitude', 'Near By', 'Speed (km/h)'],
    rows: withSerial(
      data.rows.map((row) => [
        row.vehicle,
        row.date,
        row.start,
        row.end,
        coordinate(row.latitude),
        coordinate(row.longitude),
        row.nearby,
        two(row.speed),
      ]),
    ),
  };
}

/** Speed report details. */
export function buildSpeedExport(data, subtitle = '') {
  const value = (number) => (data.hasData ? speed(number) : '-');
  return {
    title: 'Speed Report Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: `Max Speed (${data.scope})`, value: value(data.maxSpeed) },
      { label: `Min Speed (${data.scope})`, value: value(data.minSpeed) },
      { label: `Average Speed (${data.scope})`, value: value(data.avgSpeed) },
    ],
    columns: [
      'Sl.',
      'Vehicle',
      'Date',
      'Time (Start)',
      'Time (End)',
      'Latitude',
      'Longitude',
      'Max Speed (km/h)',
      'Avg Speed (km/h)',
      'Min Speed (km/h)',
    ],
    rows: withSerial(
      data.rows.map((row) => [
        row.vehicle,
        row.date,
        row.start,
        row.end,
        coordinate(row.latitude),
        coordinate(row.longitude),
        two(row.max),
        two(row.avg),
        two(row.min),
      ]),
    ),
  };
}

/** Vehicle last location report. */
export function buildLastLocationExport(data, subtitle = '') {
  return {
    title: 'Vehicle Last Location Report',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [],
    columns: [
      'Sl.',
      'Vehicle',
      'Customer (Subadmin)',
      'Model',
      'Chassis No.',
      'Installation',
      'Last Status',
      'Last Location Time',
      'Nearby Landmark',
    ],
    rows: withSerial(
      data.rows.map((row) => [row.vehicle, row.customer, row.model, row.chassis, row.installation, row.status, row.lastTime, row.nearby]),
    ),
  };
}

/** Vehicle activity details. */
export function buildActivityExport(data, subtitle = '') {
  return {
    title: 'Vehicle Activity Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Vehicles', value: String(data.vehicles) },
      { label: 'Total Trips', value: String(data.trips) },
      { label: 'Total KM', value: km(data.totalKm) },
      { label: 'Total Stop Time', value: data.stopTime },
    ],
    columns: [
      'Sl.',
      'Vehicle',
      'Customer',
      'VRN',
      'Start Time',
      'End Time',
      'Duration',
      'Distance',
      'Overspeed',
      'Trips',
      'Trip Duration',
      'Earliest Landmark',
    ],
    rows: withSerial(
      data.rows.map((row) => [
        row.vehicle,
        row.customer,
        row.vrn,
        row.start,
        row.end,
        row.duration,
        row.distance,
        row.overspeed,
        String(row.trips),
        row.tripDuration,
        row.landmark,
      ]),
    ),
  };
}

/** Movement summary details. */
export function buildMovementExport(data, subtitle = '') {
  return {
    title: 'Movement Summary Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Vehicles', value: String(data.vehicles) },
      { label: 'Total Trips', value: String(data.trips) },
      { label: 'Total KM', value: km(data.totalKm) },
      { label: 'Total Operating Time', value: data.operatingTime },
    ],
    columns: [
      'Sl.',
      'Vehicle',
      'VRN',
      'Date',
      'Month',
      'Year',
      'Start Time',
      'End Time',
      'Duration',
      'Distance (km)',
      'System Distance (km)',
      'Max Speed (km/h)',
      'Avg Speed (km/h)',
      'Trips',
      'Move Type',
      'Start Landmark',
    ],
    rows: withSerial(
      data.rows.map((row) => {
        const hasData = row.moveType !== 'No Data';
        return [
          row.vehicle,
          row.vrn,
          row.date,
          row.month,
          row.year,
          row.start,
          row.end,
          row.duration,
          numberCell(row.distance, hasData),
          numberCell(row.systemDistance, hasData),
          numberCell(row.maxSpeed, hasData),
          numberCell(row.avgSpeed, hasData),
          String(row.trips),
          row.moveType,
          row.landmark,
        ];
      }),
    ),
  };
}

/** Engine report details. */
export function buildEngineExport(data, subtitle = '') {
  return {
    title: 'Engine Report Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Engine On (hh:mm:ss)', value: data.engineOn },
      { label: 'Total Engine Off (hh:mm:ss)', value: data.engineOff },
      { label: 'Total Idle Time (hh:mm:ss)', value: data.idle },
      { label: 'Total Events (On/Off Events)', value: String(data.events) },
    ],
    columns: ['Sl.', 'Vehicle', 'Status', 'From', 'To', 'Duration'],
    rows: withSerial(data.rows.map((row) => [row.vehicle, row.status, row.from, row.to, row.duration])),
  };
}

/** Fuel alert details. */
export function buildFuelAlertExport(data, subtitle = '') {
  return {
    title: 'Fuel Alert Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Fuel Alerts', value: String(data.totalAlerts) },
      {
        label: 'Fuel Fillings',
        value: `${data.fillings} (${two(data.fillTotal)} L)`,
      },
      {
        label: 'Fuel Theft / Drops',
        value: `${data.thefts} (${two(data.theftTotal)} L)`,
      },
      { label: 'Vehicles with Fuel Alerts', value: String(data.vehicles) },
    ],
    columns: ['SL', 'Date & Time', 'Vehicle', 'Plate', 'Alert', 'Amount (L)', 'Speed (km/h)', 'Location'],
    rows: withSerial(
      data.rows.map((row) => [
        row.time,
        row.vehicle,
        row.plate,
        row.alert,
        litresText(row.amount),
        Number(row.speed).toFixed(1),
        row.address,
      ]),
    ),
  };
}

/** Trip report details. */
export function buildTripExport(data, subtitle = '') {
  return {
    title: data.vehicleName ? `Trip Report Details - ${data.vehicleName}` : 'Trip Report Details',
    subtitle,
    generatedAt: data.generatedAt,
    summary: [
      { label: 'Total Trips', value: String(data.trips) },
      { label: 'Total KM', value: km(data.totalKm) },
      { label: 'Total Trip Duration', value: data.duration },
      { label: 'Average Speed', value: speed(data.avgSpeed) },
    ],
    columns: ['SL', 'Start Time', 'Stop Time', 'Duration', 'Distance (km)', 'Speed (km/h)', 'From', 'To'],
    rows: withSerial(data.rows.map((row) => [row.start, row.end, row.duration, two(row.distance), two(row.speed), row.from, row.to])),
  };
}

/**
 * The generic report page (Payments, Due, Overspeed...): each card becomes a row of date, title, details, value and state.
 * @param {string} title
 * @param {{ summary: Array<{label, value, unit}>, rows: Array<object> }} report The report of reportsSlice
 */
export function buildGenericExport(title, report, subtitle = '') {
  const badge = (row) => [row.badge && row.badge.top, row.badge && row.badge.bottom].filter(Boolean).join(' ');
  return {
    title,
    subtitle,
    generatedAt: '',
    summary: (report.summary || []).map((item) => ({
      label: item.label,
      value: `${item.value}${item.unit ? ` ${item.unit}` : ''}`,
    })),
    columns: ['SL', 'Date', 'Title', 'Details', 'Value', 'Status'],
    rows: withSerial(
      (report.rows || []).map((row) => [badge(row), row.title || '', row.subtitle || '', row.value || '', row.valueSub || '']),
    ),
  };
}

/**
 * The line under the title of a file: the vehicle and the dates of the filters.
 * @param {{ vehicleId?: number, fromDate?: string, toDate?: string }} filters
 * @param {Array<{ id: number, name: string }>} vehicles
 */
export function exportSubtitle(filters, vehicles) {
  if (!filters) {
    return '';
  }
  const parts = [];
  if ('vehicleId' in filters) {
    const vehicle = vehicles.find((item) => item.id === filters.vehicleId);
    parts.push(vehicle ? vehicle.name : 'All vehicles');
  }
  if (filters.fromDate) {
    parts.push(filters.toDate && filters.toDate !== filters.fromDate ? `${filters.fromDate} to ${filters.toDate}` : filters.fromDate);
  }
  return parts.join(' | ');
}

/** The model the server gets: at most MAX_EXPORT_ROWS rows. */
export function limitRows(model) {
  return model.rows.length > MAX_EXPORT_ROWS ? { ...model, rows: model.rows.slice(0, MAX_EXPORT_ROWS) } : model;
}
