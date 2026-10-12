// The Last location report helpers: the quick ranges, the parsed answer and the CSV text.
import { RANGES, buildLastLocationCsv, parseLastLocationReport, rangeDates } from '../src/utils/lastLocationReport';

// 12 Oct 2026, 10:00 AM in Bangladesh
const NOW = Date.UTC(2026, 9, 12, 4, 0, 0);

const answer = {
  success: true,
  response: {
    generated_at: '12 Oct 2026 20:40',
    data: [
      {
        vehicle: 'Bogura LA 15-4717',
        plate_number: 'LA 15',
        customer: 'Md Rokon, MOTOTRACK GPS',
        model: 'FZ V2',
        chassis_no: null,
        installation_date: '0000-00-00',
        status: 'online',
        last_loc_time: '2026-10-12 14:36:35',
        nearby: 'Ya Raifu Motors, "Bogra"',
        latitude: 24.853413,
        longitude: 89.349271,
      },
      { vehicle: 'DM GA 29-3994', plate_number: 'DM GA 29-3994', status: 'offline', last_loc_time: null, latitude: null, longitude: null },
    ],
    pagination: { current_page: 1, last_page: 2, total: 16 },
  },
};

describe('RANGES and rangeDates', () => {
  it('has the five quick buttons of the web page, All first', () => {
    expect(RANGES.map((range) => range.key)).toEqual(['all', 'today', 'yesterday', 'last7', 'custom']);
  });

  it('gives the dates of each button in Bangladesh time', () => {
    expect(rangeDates('today', NOW)).toEqual({ fromDate: '2026-10-12', toDate: '2026-10-12' });
    expect(rangeDates('yesterday', NOW)).toEqual({ fromDate: '2026-10-11', toDate: '2026-10-11' });
    expect(rangeDates('last7', NOW)).toEqual({ fromDate: '2026-10-06', toDate: '2026-10-12' });
  });
});

describe('parseLastLocationReport', () => {
  const data = parseLastLocationReport(answer);

  it('turns vehicles into rows with a status badge', () => {
    expect(data.rows[0]).toMatchObject({
      vehicle: 'Bogura LA 15-4717',
      plate: 'LA 15',
      customer: 'Md Rokon, MOTOTRACK GPS',
      model: 'FZ V2',
      chassis: '-',
      isOnline: true,
      status: 'ONLINE',
      lastTime: '2026-10-12 14:36:35',
      latitude: 24.853413,
    });
    expect(data.rows[1]).toMatchObject({ isOnline: false, status: 'OFFLINE', lastTime: '-', latitude: null, plate: '' });
  });

  it('keeps the paging and the generated time', () => {
    expect(data.total).toBe(16);
    expect(data.lastPage).toBe(2);
    expect(data.generatedAt).toBe('12 Oct 2026 20:40');
  });

  it('copes with an empty answer', () => {
    expect(parseLastLocationReport({ success: true, response: {} }).rows).toEqual([]);
  });
});

describe('buildLastLocationCsv', () => {
  it('writes a header and one quoted line per vehicle', () => {
    const lines = buildLastLocationCsv(parseLastLocationReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Vehicle,Customer (Subadmin),Model,Chassis No.,Installation,Last Status,Last Location Time,Nearby Landmark');
    expect(lines[2]).toBe('1,"Bogura LA 15-4717","Md Rokon, MOTOTRACK GPS","FZ V2","-",0000-00-00,ONLINE,2026-10-12 14:36:35,"Ya Raifu Motors, ""Bogra"""');
  });
});
