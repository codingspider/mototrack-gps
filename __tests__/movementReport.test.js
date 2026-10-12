// The Movement summary report helpers: the clock text, the parsed answer, number cells and the CSV text.
import { buildMovementCsv, clockText, numberCell, parseMovementReport } from '../src/utils/movementReport';

const answer = {
  success: true,
  response: {
    generated_at: '12 Oct 2026 20:40',
    summary: { vehicles: 16, trips: 54, distance: 141.02, operating_time: '04:31:00' },
    data: [
      {
        vehicle_name: 'Bogura LA 15-4717',
        vrn: '-',
        date: '2026-10-12',
        start_time: '2026-10-12 00:19:51',
        end_time: '2026-10-12 15:42:08',
        duration: '15:22:17',
        max_speed: 62,
        avg_speed: 25.79,
        distance: 40.8,
        system_distance: 38.47,
        trips: 6,
        move_type: 'Moving',
        start_landmark: 'Ya Raifu Motors, "Bogra"',
      },
      { vehicle_name: 'Bogura TA 02-0293', vrn: 'Bogura TA 02-0293', date: '2026-10-12', start_time: '-', end_time: '-', duration: '-', distance: 0, trips: 0, move_type: 'No Data' },
    ],
    pagination: { current_page: 1, last_page: 1, total: 2 },
  },
};

describe('clockText', () => {
  it('keeps the time of day', () => {
    expect(clockText('2026-10-12 00:19:51')).toBe('00:19:51');
    expect(clockText('2026-10-12 00:19')).toBe('00:19');
    expect(clockText('-')).toBe('-');
    expect(clockText(null)).toBe('-');
  });
});

describe('parseMovementReport', () => {
  const data = parseMovementReport(answer);

  it('keeps the four summary boxes', () => {
    expect(data.vehicles).toBe(16);
    expect(data.trips).toBe(54);
    expect(data.totalKm).toBe(141.02);
    expect(data.operatingTime).toBe('04:31:00');
    expect(data.generatedAt).toBe('12 Oct 2026 20:40');
  });

  it('splits the date into date, month and year like the web table', () => {
    expect(data.rows[0]).toMatchObject({
      vehicle: 'Bogura LA 15-4717',
      date: '12 Oct 2026',
      month: 'October',
      year: '2026',
      start: '00:19:51',
      end: '15:42:08',
      duration: '15:22:17',
      distance: 40.8,
      systemDistance: 38.47,
      maxSpeed: 62,
      avgSpeed: 25.79,
      trips: 6,
      moveType: 'Moving',
    });
  });

  it('keeps a vehicle without data', () => {
    expect(data.rows[1]).toMatchObject({ moveType: 'No Data', start: '-', maxSpeed: null, landmark: '-' });
  });

  it('copes with an empty answer', () => {
    const empty = parseMovementReport({ success: true, response: {} });
    expect(empty.rows).toEqual([]);
    expect(empty.operatingTime).toBe('00:00:00');
  });
});

describe('numberCell and buildMovementCsv', () => {
  it('writes two decimals, or a dash with no data', () => {
    expect(numberCell(40.8)).toBe('40.80');
    expect(numberCell(null)).toBe('-');
    expect(numberCell(0, false)).toBe('-');
  });

  it('writes a header and one line per row', () => {
    const lines = buildMovementCsv(parseMovementReport(answer)).split('\n');
    expect(lines[1]).toContain('SL,Vehicle,VRN,Date,Month,Year,Start Time,End Time,Duration');
    expect(lines[2]).toBe(
      '1,"Bogura LA 15-4717","-","12 Oct 2026",October,2026,00:19:51,15:42:08,15:22:17,40.80,38.47,62.00,25.79,6,Moving,"Ya Raifu Motors, ""Bogra"""',
    );
    expect(lines[3]).toContain(',-,-,-,-,0,No Data,');
  });
});
