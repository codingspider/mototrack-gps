// The Trip report helpers: the request params, the parsed answer and the CSV text.
import { buildTripCsv, buildTripParams, parseTripReport } from '../src/utils/tripReport';

const filters = {
  vehicleId: 7,
  search: '',
  fromDate: '2026-10-05',
  toDate: '2026-10-12',
  fromTime: '00:00',
  toTime: '23:59',
};

const answer = {
  status: 1,
  generated_at: '12 Oct 2026 14:39',
  selected_device: { id: 7, name: 'Bogura LA 15-4717', plate_number: 'LA 15' },
  summary: { trips: 4, distance: 19.14, duration: '00:50:33', avg_speed: 22.72 },
  items: [
    { start_time: '2026-10-12 08:45:37', end_time: '2026-10-12 08:47:22', duration: '00:01:45', distance: 0.86, speed: 27.38, from: 'Boro Bhadahar, "Kahaloo"', to: 'Murail, Kahaloo' },
    { start_time: '2026-10-12 08:54:20', end_time: '2026-10-12 09:19:21', duration: '00:25:01', distance: 11.51, speed: 26.68, from: null, to: null },
  ],
  pagination: { current_page: 1, last_page: 1, total: 2 },
};

describe('buildTripParams', () => {
  it('takes the dates apart like the web form and sends the vehicle', () => {
    expect(buildTripParams(filters, 2, 25)).toEqual({
      from_day: 5,
      from_month: 10,
      from_year: 2026,
      from_time: '00:00',
      to_day: 12,
      to_month: 10,
      to_year: 2026,
      to_time: '23:59',
      limit: 25,
      page: 2,
      device_id: 7,
    });
  });

  it('sends the search instead of the vehicle when something is typed', () => {
    const params = buildTripParams({ ...filters, search: ' LA 15 ' }, 1, 25);
    expect(params.search_phrase).toBe('LA 15');
    expect(params.device_id).toBeUndefined();
  });
});

describe('parseTripReport', () => {
  const data = parseTripReport(answer);

  it('keeps the four summary boxes and the vehicle name', () => {
    expect(data.vehicleName).toBe('Bogura LA 15-4717');
    expect(data.trips).toBe(4);
    expect(data.totalKm).toBe(19.14);
    expect(data.duration).toBe('00:50:33');
    expect(data.avgSpeed).toBe(22.72);
    expect(data.generatedAt).toBe('12 Oct 2026 14:39');
  });

  it('turns trips into rows, with dashes for a missing address', () => {
    expect(data.rows[0]).toMatchObject({ start: '2026-10-12 08:45:37', end: '2026-10-12 08:47:22', duration: '00:01:45', distance: 0.86, speed: 27.38 });
    expect(data.rows[1]).toMatchObject({ from: '-', to: '-' });
  });

  it('copes with an empty answer', () => {
    const empty = parseTripReport({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.duration).toBe('00:00:00');
  });
});

describe('buildTripCsv', () => {
  it('writes a header and one quoted line per trip', () => {
    const lines = buildTripCsv(parseTripReport(answer)).split('\n');
    expect(lines[0]).toBe('Trip Report Details - Bogura LA 15-4717');
    expect(lines[1]).toBe('SL,Start Time,Stop Time,Duration,Distance (km),Speed (km/h),From,To');
    expect(lines[2]).toBe('1,2026-10-12 08:45:37,2026-10-12 08:47:22,00:01:45,0.86,27.38,"Boro Bhadahar, ""Kahaloo""","Murail, Kahaloo"');
  });
});
