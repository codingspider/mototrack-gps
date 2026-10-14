// The export models of every report: each row has as many cells as there are columns, cells are text,
// and the numbers are written the same way as on the screen.
import { parseActivityReport } from '../src/utils/activityReport';
import { parseDailyActivity } from '../src/utils/dailyActivity';
import { parseEngineReport } from '../src/utils/engineReport';
import { parseFuelAlertReport } from '../src/utils/fuelAlertReport';
import { parseHourlyReport } from '../src/utils/hourlyReport';
import { parseLastLocationReport } from '../src/utils/lastLocationReport';
import { parseLocationReport } from '../src/utils/locationReport';
import { parseMonthlyOverview } from '../src/utils/monthlyOverview';
import { parseMovementReport } from '../src/utils/movementReport';
import { parseSpeedReport } from '../src/utils/speedReport';
import { parseTripReport } from '../src/utils/tripReport';
import {
  MAX_EXPORT_ROWS,
  buildActivityExport,
  buildDailyExport,
  buildEngineExport,
  buildFuelAlertExport,
  buildGenericExport,
  buildHourlyExport,
  buildLastLocationExport,
  buildLocationExport,
  buildMonthlyExport,
  buildMovementExport,
  buildSpeedExport,
  buildTripExport,
  exportSubtitle,
  limitRows,
} from '../src/utils/reportExports';

const pagination = { current_page: 1, last_page: 1, total: 1 };

/** Every cell is text and every row is as long as the header. */
function expectTable(model) {
  expect(model.title).toBeTruthy();
  expect(model.columns.length).toBeGreaterThan(0);
  expect(model.rows.length).toBeGreaterThan(0);
  model.rows.forEach((row) => {
    expect(row).toHaveLength(model.columns.length);
    row.forEach((cell) => expect(typeof cell).toBe('string'));
  });
  model.summary.forEach((item) => {
    expect(typeof item.label).toBe('string');
    expect(typeof item.value).toBe('string');
  });
}

describe('report export models', () => {
  it('daily activity', () => {
    const data = parseDailyActivity({
      selected_device: { name: 'Bike 1' },
      period: { days: 1 },
      total_km: 12.5,
      distance_summary: { today_km: 3, total_km: 99, total_since: '2026-09-26' },
      items: [{ date: '06 Oct, 2026', date_raw: '2026-10-06', km: 12.5, start_time: '02:00 AM', end_time: '05:00 PM', duration_format: '14:00:00' }],
      pagination,
    });
    const model = buildDailyExport(data, 'Bike 1 | 2026-10-06');
    expectTable(model);
    expect(model.rows[0]).toEqual(['1', '06 Oct, 2026', '12.50', '02:00 AM', '05:00 PM', '14:00:00']);
  });

  it('monthly overview ends with a Total row', () => {
    const data = parseMonthlyOverview({
      period: { label: 'Oct 2026' },
      dates: ['2026-10-01', '2026-10-02'],
      items: [{ device_id: 1, name: 'Bike 1', plate_number: 'DHA 1', total: 7, by_date: { '2026-10-01': 3, '2026-10-02': 4 } }],
      date_totals: { '2026-10-01': 3, '2026-10-02': 4 },
      fleet_total: 7,
      pagination,
    });
    const model = buildMonthlyExport(data);
    expectTable(model);
    expect(model.columns).toHaveLength(6);
    expect(model.rows[model.rows.length - 1][1]).toBe('Total');
  });

  it('hourly report ends with a Total row', () => {
    const data = parseHourlyReport({
      summary: { vehicles: 1, distance: 5 },
      items: [{ hour: 1, date: '2026-10-06', km: 5, hour_start: '01:00 AM', hour_end: '02:00 AM', max_speed: 40, min_speed: 0 }],
      pagination,
    });
    const model = buildHourlyExport(data);
    expectTable(model);
    expect(model.rows[model.rows.length - 1].slice(0, 3)).toEqual(['', 'Total', '5.00']);
  });

  it('location, speed and last location', () => {
    expectTable(
      buildLocationExport(
        parseLocationReport({
          summary: { vehicles: 1 },
          items: [{ vehicle_name: 'Bike 1', date: '2026-10-06', start_time: '01:00', latitude: 23.8, longitude: 90.4, nearby: 'Mirpur', speed: 20 }],
          pagination,
        }),
      ),
    );
    expectTable(
      buildSpeedExport(
        parseSpeedReport({
          date: '2026-10-06',
          speed_summary: { max_speed: 50, min_speed: 0, avg_speed: 20 },
          items: [{ vehicle: 'Bike 1', date: '2026-10-06', start_time: '01:00', latitude: 23.8, longitude: 90.4, max_speed: 50, avg_speed: 20, min_speed: 0 }],
          pagination,
        }),
      ),
    );
    expectTable(
      buildLastLocationExport(
        parseLastLocationReport({ data: [{ vehicle: 'Bike 1', customer: 'A', status: 'online', last_loc_time: 'x', nearby: 'y' }], pagination }),
      ),
    );
  });

  it('activity, movement and engine', () => {
    expectTable(
      buildActivityExport(
        parseActivityReport({ summary: { vehicles: 1 }, data: [{ bstid: 'B1', vrn: 'V', start_time: '2026-10-06 01:00:00', distance: 4, trips: 2 }], pagination }),
      ),
    );
    expectTable(
      buildMovementExport(
        parseMovementReport({ summary: {}, data: [{ vehicle_name: 'Bike 1', date: '2026-10-06', distance: 4, trips: 1, move_type: 'Moved' }], pagination }),
      ),
    );
    expectTable(
      buildEngineExport(
        parseEngineReport({
          totals: { on: '01:00:00' },
          items: [{ vehicle: 'Bike 1', status: 'ON', from: '2026-10-06 01:00:00', to: '2026-10-06 02:00:00', duration: '01:00:00' }],
          pagination,
        }),
      ),
    );
  });

  it('fuel alert and trip', () => {
    expectTable(
      buildFuelAlertExport(
        parseFuelAlertReport({
          summary: { total: 1 },
          items: [{ id: 1, time: '2026-10-06 01:00:00', vehicle: 'Bike 1', label: 'Fuel fill', amount: 3.5, speed: 0 }],
          pagination,
        }),
      ),
    );
    const trip = buildTripExport(
      parseTripReport({
        selected_device: { name: 'Bike 1' },
        items: [{ start_time: 'a', end_time: 'b', duration: '00:10:00', distance: 2, speed: 30, from: 'x', to: 'y' }],
        pagination,
      }),
    );
    expectTable(trip);
    expect(trip.rows[0][5]).toBe('30.00');
  });

  it('generic report cards', () => {
    const model = buildGenericExport(
      'Payment report',
      {
        summary: [{ label: 'Paid', value: '2', unit: 'payments' }],
        rows: [{ badge: { top: '06', bottom: 'Oct' }, title: 'Bike 1', subtitle: 'DGePay', value: '500', valueSub: 'Paid' }],
      },
      'All vehicles',
    );
    expectTable(model);
    expect(model.rows[0]).toEqual(['1', '06 Oct', 'Bike 1', 'DGePay', '500', 'Paid']);
    expect(model.summary[0].value).toBe('2 payments');
  });

  it('limits the rows and writes the subtitle', () => {
    const rows = Array.from({ length: MAX_EXPORT_ROWS + 5 }, (_, index) => [String(index)]);
    expect(limitRows({ rows }).rows).toHaveLength(MAX_EXPORT_ROWS);
    const vehicles = [{ id: 4, name: 'Bike 4' }];
    expect(exportSubtitle({ vehicleId: 4, fromDate: '2026-10-01', toDate: '2026-10-02' }, vehicles)).toBe('Bike 4 | 2026-10-01 to 2026-10-02');
    expect(exportSubtitle({ vehicleId: 0, fromDate: '2026-10-01', toDate: '2026-10-01' }, vehicles)).toBe('All vehicles | 2026-10-01');
    expect(exportSubtitle(null, vehicles)).toBe('');
  });
});
