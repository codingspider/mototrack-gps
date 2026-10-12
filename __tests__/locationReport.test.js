// The Location report helpers: the parsed answer and the CSV text.
import { buildLocationCsv, parseLocationReport } from '../src/utils/locationReport';

const answer = {
  status: 1,
  generated_at: '12 Oct 2026 20:37',
  items: [
    {
      vehicle: 'Bogura LA 15-4717 (LA 15)',
      vehicle_name: 'Bogura LA 15-4717',
      date: '2026-10-12',
      start_time: '00:19:51',
      end_time: '00:19:51',
      latitude: 24.853413,
      longitude: 89.349271,
      nearby: 'Ya Raifu Motors, Bogra City Bypass, "Bogura"',
      speed: 0,
    },
    { vehicle: 'No GPS', date: '2026-10-12', clock_time: '00:21:06', latitude: null, longitude: null, nearby: null, speed: 27 },
  ],
  summary: { vehicles: 16, distance: 141.02, avg_speed: 26.87, operating: '00:00 - 23:59', max_speed: 62 },
  pagination: { current_page: 1, last_page: 3, total: 60 },
};

describe('parseLocationReport', () => {
  const data = parseLocationReport(answer);

  it('keeps the summary boxes', () => {
    expect(data.vehicles).toBe(16);
    expect(data.totalKm).toBe(141.02);
    expect(data.avgSpeed).toBe(26.87);
    expect(data.operating).toBe('00:00 - 23:59');
    expect(data.maxSpeed).toBe(62);
    expect(data.generatedAt).toBe('12 Oct 2026 20:37');
  });

  it('turns the points into rows, with unique keys', () => {
    expect(data.rows[0]).toMatchObject({
      vehicle: 'Bogura LA 15-4717',
      date: '2026-10-12',
      start: '00:19:51',
      end: '00:19:51',
      latitude: 24.853413,
      longitude: 89.349271,
      speed: 0,
    });
    expect(new Set(data.rows.map((row) => row.key)).size).toBe(2);
  });

  it('copes with a point without position or address, and old answers', () => {
    expect(data.rows[1].latitude).toBeNull();
    expect(data.rows[1].nearby).toBe('-');
    expect(data.rows[1].start).toBe('00:21:06');
  });

  it('knows about more pages', () => {
    expect(data.page).toBe(1);
    expect(data.lastPage).toBe(3);
    expect(data.total).toBe(60);
  });

  it('copes with an empty answer', () => {
    const empty = parseLocationReport({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.total).toBe(0);
  });
});

describe('buildLocationCsv', () => {
  it('writes a header, quotes the address and leaves a missing position empty', () => {
    const lines = buildLocationCsv(parseLocationReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Vehicle,Date,Time (Start),Time (End),Latitude,Longitude,Near By,Speed (km/h)');
    expect(lines[2]).toBe('1,"Bogura LA 15-4717",2026-10-12,00:19:51,00:19:51,24.853413,89.349271,"Ya Raifu Motors, Bogra City Bypass, ""Bogura""",0.00');
    expect(lines[3]).toBe('2,"No GPS",2026-10-12,00:21:06,00:21:06,,,"-",27.00');
  });
});
