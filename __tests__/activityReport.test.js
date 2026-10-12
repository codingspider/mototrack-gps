// The Vehicle activity report helpers: the time text, the parsed answer and the CSV text.
import { activityTime, buildActivityCsv, parseActivityReport } from '../src/utils/activityReport';

const answer = {
  success: true,
  response: {
    generated_at: '12 Oct 2026 20:40',
    summary: { vehicles: 16, trips: 26, distance: 88.37, stop_time: '05:10:37' },
    data: [
      {
        customer: 'Md Rokon, MOTOTRACK GPS',
        bstid: 'Bogura LA 15-4717',
        vrn: null,
        start_time: '2026-10-12 08:45:11',
        end_time: '2026-10-12 09:42:03',
        duration: '00:50:33',
        distance: 19.14,
        overspeed: null,
        trips: 4,
        trip_duration: 0.84,
        earliest_landmark: 'Boro Bhadahar, "Kahaloo"',
      },
      { customer: null, bstid: 'Bogura TA 02-0293', vrn: 'Bogura TA 02-0293', start_time: null, end_time: null, trips: 0 },
    ],
    pagination: { current_page: 1, last_page: 1, total: 2 },
  },
};

describe('activityTime', () => {
  it('writes the web format and a dash for no time', () => {
    expect(activityTime('2026-10-12 08:45:11')).toBe('12 Oct, 08:45 AM');
    expect(activityTime('2026-10-12 21:05:00')).toBe('12 Oct, 09:05 PM');
    expect(activityTime(null)).toBe('-');
    expect(activityTime('')).toBe('-');
  });
});

describe('parseActivityReport', () => {
  const data = parseActivityReport(answer);

  it('keeps the four summary boxes', () => {
    expect(data.vehicles).toBe(16);
    expect(data.trips).toBe(26);
    expect(data.totalKm).toBe(88.37);
    expect(data.stopTime).toBe('05:10:37');
    expect(data.generatedAt).toBe('12 Oct 2026 20:40');
  });

  it('writes distance and trip duration like the web page', () => {
    expect(data.rows[0]).toMatchObject({
      vehicle: 'Bogura LA 15-4717',
      customer: 'Md Rokon, MOTOTRACK GPS',
      vrn: '-',
      start: '12 Oct, 08:45 AM',
      end: '12 Oct, 09:42 AM',
      duration: '00:50:33',
      distance: '19.14 KM',
      overspeed: '-',
      trips: 4,
      tripDuration: '0.84 Hours',
    });
  });

  it('keeps vehicles that did not move, with dashes', () => {
    expect(data.rows[1]).toMatchObject({ vehicle: 'Bogura TA 02-0293', start: '-', distance: '-', tripDuration: '-', trips: 0, landmark: '-' });
  });

  it('copes with an empty answer', () => {
    const empty = parseActivityReport({ success: true, response: {} });
    expect(empty.rows).toEqual([]);
    expect(empty.stopTime).toBe('00:00:00');
  });
});

describe('buildActivityCsv', () => {
  it('writes a header and one quoted line per vehicle', () => {
    const lines = buildActivityCsv(parseActivityReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Vehicle,Customer,VRN,Start Time,End Time,Duration,Distance,Overspeed,Trips,Trip Duration,Earliest Landmark');
    expect(lines[2]).toBe(
      '1,"Bogura LA 15-4717","Md Rokon, MOTOTRACK GPS","-","12 Oct, 08:45 AM","12 Oct, 09:42 AM",00:50:33,19.14 KM,-,4,0.84 Hours,"Boro Bhadahar, ""Kahaloo"""',
    );
  });
});
