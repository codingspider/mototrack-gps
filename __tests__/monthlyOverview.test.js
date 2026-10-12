// The Monthly overview helpers: the parsed answer, the km cell and the CSV text.
import { buildMonthlyCsv, kmCell, parseMonthlyOverview } from '../src/utils/monthlyOverview';

const answer = {
  status: 1,
  dates: ['2026-10-11', '2026-10-12'],
  period: { days: 2, label: '11 – 12 Oct 2026' },
  distance_unit: 'km',
  vehicles_count: 2,
  generated_at: '12 Oct 2026 17:44',
  items: [
    { device_id: 7, name: 'Bogura LA 15-4717', plate_number: null, by_date: { '2026-10-11': 19.21, '2026-10-12': 40.8 }, total: 60.01 },
    { device_id: 8, name: 'Bogura NA 11-1516', plate_number: 'NA 11', by_date: { '2026-10-11': 0, '2026-10-12': 37.41 }, total: 37.41 },
  ],
  date_totals: { '2026-10-11': 19.21, '2026-10-12': 78.21 },
  fleet_total: 97.42,
  pagination: { total: 2, from: 1, to: 2 },
};

describe('parseMonthlyOverview', () => {
  const data = parseMonthlyOverview(answer);

  it('keeps the period, the unit and the vehicle count', () => {
    expect(data.periodLabel).toBe('11 – 12 Oct 2026');
    expect(data.unit).toBe('km');
    expect(data.vehiclesCount).toBe(2);
    expect(data.generatedAt).toBe('12 Oct 2026 17:44');
  });

  it('has one column per date, with the totals in the same order', () => {
    expect(data.dates.map((date) => date.label)).toEqual(['11 Oct', '12 Oct']);
    expect(data.dateTotals).toEqual([19.21, 78.21]);
    expect(data.fleetTotal).toBe(97.42);
  });

  it('turns vehicles into rows and fills a missing plate', () => {
    expect(data.rows[0]).toMatchObject({ key: '7', name: 'Bogura LA 15-4717', plate: '-', total: 60.01 });
    expect(data.rows[1].byDate['2026-10-12']).toBe(37.41);
    expect(data.total).toBe(2);
  });

  it('copes with an empty answer', () => {
    const empty = parseMonthlyOverview({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.dates).toEqual([]);
    expect(empty.vehiclesCount).toBe(0);
  });
});

describe('kmCell and buildMonthlyCsv', () => {
  it('shows a dash for a day without movement', () => {
    expect(kmCell(0)).toBe('-');
    expect(kmCell(undefined)).toBe('-');
    expect(kmCell(40.8)).toBe('40.80');
  });

  it('writes a header and one line per vehicle', () => {
    const lines = buildMonthlyCsv(parseMonthlyOverview(answer)).split('\n');
    expect(lines[0]).toBe('Monthly Distance Overview (11 – 12 Oct 2026)');
    expect(lines[1]).toBe('SL,Vehicle,Plate Number,Total (km),11 Oct,12 Oct');
    expect(lines[2]).toBe('1,"Bogura LA 15-4717","-",60.01,19.21,40.80');
    expect(lines[3]).toBe('2,"Bogura NA 11-1516","NA 11",37.41,0.00,37.41');
  });
});
