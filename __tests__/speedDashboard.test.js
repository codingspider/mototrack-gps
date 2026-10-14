// The maths behind the speedometer page: the dial, the needle and the odometer boxes.
import {
  GAUGE_MAX_SPEED,
  GAUGE_ZONES,
  getArcPath,
  getArcPoint,
  getGaugeFraction,
  getNeedleDegrees,
} from '../src/utils/gauge';
import { getOdometerDigits } from '../src/utils/odometer';
import { getTravelNumbers } from '../src/utils/vehicleTravel';

describe('getGaugeFraction', () => {
  it('is 0 at a stop and 1 at the end of the dial', () => {
    expect(getGaugeFraction(0)).toBe(0);
    expect(getGaugeFraction(GAUGE_MAX_SPEED)).toBe(1);
    expect(getGaugeFraction(GAUGE_MAX_SPEED / 2)).toBe(0.5);
  });

  it('keeps the needle on the dial for a bad or very high speed', () => {
    expect(getGaugeFraction(-5)).toBe(0);
    expect(getGaugeFraction(null)).toBe(0);
    expect(getGaugeFraction('abc')).toBe(0);
    expect(getGaugeFraction(400)).toBe(1);
  });

  it('reads a speed sent as text', () => {
    expect(getGaugeFraction('80')).toBe(0.5);
  });
});

describe('getNeedleDegrees', () => {
  it('turns from the left end to the right end', () => {
    expect(getNeedleDegrees(0)).toBe(-90);
    expect(getNeedleDegrees(0.5)).toBe(0);
    expect(getNeedleDegrees(1)).toBe(90);
  });
});

describe('dial arcs', () => {
  it('puts the ends of the dial on the left and right of the centre', () => {
    const left = getArcPoint(100, 100, 50, 0);
    const top = getArcPoint(100, 100, 50, 0.5);
    const right = getArcPoint(100, 100, 50, 1);
    expect(Math.round(left.x)).toBe(50);
    expect(Math.round(left.y)).toBe(100);
    expect(Math.round(top.x)).toBe(100);
    expect(Math.round(top.y)).toBe(50);
    expect(Math.round(right.x)).toBe(150);
    expect(Math.round(right.y)).toBe(100);
  });

  it('writes an SVG arc path', () => {
    expect(getArcPath(100, 100, 50, 0, 1)).toBe('M 50 100 A 50 50 0 0 1 150 100');
  });

  it('has zones that cover the whole dial without gaps', () => {
    expect(GAUGE_ZONES[0].from).toBe(0);
    expect(GAUGE_ZONES[GAUGE_ZONES.length - 1].to).toBe(1);
    GAUGE_ZONES.slice(1).forEach((zone, index) => {
      expect(zone.from).toBe(GAUGE_ZONES[index].to);
    });
  });
});

describe('getOdometerDigits', () => {
  const text = (digits) => digits.map((digit) => digit.char).join('');

  it('pads with zeros up to the number of boxes', () => {
    expect(text(getOdometerDigits(6057, 6))).toBe('006057');
    expect(text(getOdometerDigits(0, 4, 1))).toBe('00000');
  });

  it('marks the boxes after the decimal point', () => {
    const digits = getOdometerDigits(16.46, 4, 1);
    expect(text(digits)).toBe('00165');
    expect(digits.map((digit) => digit.isDecimal)).toEqual([false, false, false, false, true]);
  });

  it('rounds and reads text numbers', () => {
    expect(text(getOdometerDigits('449.6', 6))).toBe('000450');
  });

  it('stops at all nines when the number does not fit', () => {
    expect(text(getOdometerDigits(12345678, 6))).toBe('999999');
  });

  it('is null while the distance is not known', () => {
    expect(getOdometerDigits(null, 6)).toBeNull();
    expect(getOdometerDigits(undefined, 6)).toBeNull();
    expect(getOdometerDigits('', 6)).toBeNull();
    expect(getOdometerDigits('abc', 6)).toBeNull();
    expect(getOdometerDigits(-3, 6)).toBeNull();
  });
});

describe('getTravelNumbers', () => {
  it('is unknown until the vehicle details are loaded', () => {
    expect(getTravelNumbers({ id: 1 })).toEqual({ todayKm: null, totalKm: null });
    expect(getTravelNumbers(undefined)).toEqual({ todayKm: null, totalKm: null });
  });

  it('reads today and total from the details as numbers', () => {
    const vehicle = { details: { today_travel: '107.16', total_distance: 449.06 } };
    expect(getTravelNumbers(vehicle)).toEqual({ todayKm: 107.16, totalKm: 449.06 });
  });

  it('prefers values on the vehicle itself', () => {
    const vehicle = { today_travel: 5, total_distance: 20, details: { today_travel: 99, total_distance: 999 } };
    expect(getTravelNumbers(vehicle)).toEqual({ todayKm: 5, totalKm: 20 });
  });
});
