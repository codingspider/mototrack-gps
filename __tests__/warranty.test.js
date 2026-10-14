// The warranty countdown maths of the Warranty page.
import {
  countWarranties,
  getRemainingShare,
  getSecondsLeft,
  parseWarranties,
  splitSeconds,
} from '../src/utils/warranty';

const item = (id, totalSeconds, expired = false) => ({
  device_id: id,
  name: `Device ${id}`,
  plate_number: null,
  warranty_start: '2026-01-01',
  warranty_end: '2026-12-31',
  warranty_period: '1 year',
  expired,
  countdown: { total_seconds: totalSeconds },
});

describe('parseWarranties', () => {
  it('puts the warranty that ends first on top and the expired ones last', () => {
    const rows = parseWarranties({ status: 1, items: [item(1, 9000), item(2, 0, true), item(3, 100)] });
    expect(rows.map((row) => row.deviceId)).toEqual([3, 1, 2]);
    expect(rows[2].isExpired).toBe(true);
  });

  it('reads the fields and fills the missing ones', () => {
    const [row] = parseWarranties({ items: [item(7, 86400)] });
    expect(row).toMatchObject({ deviceId: 7, name: 'Device 7', plateNumber: '', secondsLeft: 86400, period: '1 year' });
  });

  it('gives an empty list for an empty or wrong answer', () => {
    expect(parseWarranties(null)).toEqual([]);
    expect(parseWarranties({ status: 1 })).toEqual([]);
  });
});

describe('getSecondsLeft', () => {
  it('counts down from what the server said', () => {
    expect(getSecondsLeft(1000, 0, 0)).toBe(1000);
    expect(getSecondsLeft(1000, 10000, 70000)).toBe(940); // 60 s passed
  });

  it('never goes below zero', () => {
    expect(getSecondsLeft(30, 0, 120000)).toBe(0);
  });
});

describe('splitSeconds', () => {
  it('splits into days, hours and minutes', () => {
    expect(splitSeconds(2 * 86400 + 3 * 3600 + 4 * 60 + 5)).toEqual({ days: 2, hours: 3, minutes: 4 });
    expect(splitSeconds(0)).toEqual({ days: 0, hours: 0, minutes: 0 });
    expect(splitSeconds(-50)).toEqual({ days: 0, hours: 0, minutes: 0 });
  });
});

describe('getRemainingShare', () => {
  it('is full at the start and empty at the end', () => {
    const wholeYear = 365 * 86400 - 1; // 1 Jan 00:00 to 31 Dec 23:59:59
    expect(getRemainingShare('2026-01-01', '2026-12-31', wholeYear)).toBeCloseTo(1, 5);
    expect(getRemainingShare('2026-01-01', '2026-12-31', 0)).toBe(0);
  });

  it('is half when half the period is left', () => {
    expect(getRemainingShare('2026-01-01', '2026-01-02', 86400)).toBeCloseTo(0.5, 2);
  });

  it('is 0 without dates', () => {
    expect(getRemainingShare(null, null, 100)).toBe(0);
  });
});

describe('countWarranties', () => {
  it('counts active and expired', () => {
    const rows = parseWarranties({ items: [item(1, 100), item(2, 0, true), item(3, 5000)] });
    expect(countWarranties(rows)).toEqual({ total: 3, expired: 1, active: 2 });
  });
});
