// The Fuel alert report helpers: the type choices, the time and litre text, the parsed answer and the CSV text.
import { FUEL_ALERT_TYPES, alertTime, buildFuelAlertCsv, litresText, parseFuelAlertReport } from '../src/utils/fuelAlertReport';

const answer = {
  status: 1,
  generated_at: '12 Oct 2026 14:41',
  summary: { total: 3, vehicles: 2, fill_count: 1, fill_total: 40.5, theft_count: 1, theft_total: 12.25 },
  items: [
    { id: 11, time: '2026-10-12 14:36:35', vehicle: 'Bogura LA 15-4717', plate: 'LA 15', type: 'fuel_fill', label: 'Fuel Filling', amount: 40.5, speed: 0, latitude: 24.85, longitude: 89.35, address: 'Ya Raifu Motors, "Bogra"' },
    { id: 12, time: '2026-10-12 10:05:00', vehicle: 'DM GA 32-4468', plate: null, type: 'custom', label: 'Fuel level low', amount: null, speed: 12.5, latitude: null, longitude: null, address: null },
  ],
  pagination: { total: 3, current_page: 1, last_page: 2 },
};

describe('FUEL_ALERT_TYPES', () => {
  it('has the four choices of the web page, all alerts first', () => {
    expect(FUEL_ALERT_TYPES.map((type) => type.value)).toEqual(['', 'fuel_fill', 'fuel_theft', 'custom_fuel']);
    expect(FUEL_ALERT_TYPES[0].label).toBe('All Fuel Alerts');
  });
});

describe('alertTime and litresText', () => {
  it('writes a readable time and a dash for none', () => {
    expect(alertTime('2026-10-12 14:36:35')).toBe('12 Oct 2026, 02:36 PM');
    expect(alertTime(null)).toBe('-');
  });

  it('writes litres with two decimals', () => {
    expect(litresText(40.5)).toBe('40.50');
    expect(litresText(null)).toBe('-');
  });
});

describe('parseFuelAlertReport', () => {
  const data = parseFuelAlertReport(answer);

  it('keeps the summary boxes', () => {
    expect(data.totalAlerts).toBe(3);
    expect(data.fillings).toBe(1);
    expect(data.fillTotal).toBe(40.5);
    expect(data.thefts).toBe(1);
    expect(data.theftTotal).toBe(12.25);
    expect(data.vehicles).toBe(2);
    expect(data.generatedAt).toBe('12 Oct 2026 14:41');
  });

  it('turns alerts into rows, with dashes for what is missing', () => {
    expect(data.rows[0]).toMatchObject({ vehicle: 'Bogura LA 15-4717', plate: 'LA 15', alert: 'Fuel Filling', amount: 40.5, latitude: 24.85 });
    expect(data.rows[1]).toMatchObject({ plate: '-', amount: null, address: '-', latitude: null, speed: 12.5 });
    expect(data.lastPage).toBe(2);
    expect(data.total).toBe(3);
  });

  it('copes with an empty answer', () => {
    const empty = parseFuelAlertReport({ status: 1 });
    expect(empty.rows).toEqual([]);
    expect(empty.totalAlerts).toBe(0);
  });
});

describe('buildFuelAlertCsv', () => {
  it('writes a header and one quoted line per alert', () => {
    const lines = buildFuelAlertCsv(parseFuelAlertReport(answer)).split('\n');
    expect(lines[1]).toBe('SL,Date & Time,Vehicle,Plate,Alert,Amount (L),Speed (km/h),Location');
    expect(lines[2]).toBe('1,"12 Oct 2026, 02:36 PM","Bogura LA 15-4717","LA 15","Fuel Filling",40.50,0.0,"Ya Raifu Motors, ""Bogra"""');
    expect(lines[3]).toContain(',"-","Fuel level low",-,12.5,"-"');
  });
});
