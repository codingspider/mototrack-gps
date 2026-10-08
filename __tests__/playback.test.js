import {
  buildTimeline,
  cumulativeKm,
  findStops,
  formatDuration,
  MIN_STOP_SECONDS,
  positionAt,
  summarizeTrip,
} from '../src/utils/playbackStats';
import { describeRange, getPresetRange, isRangeBackwards, rangeKey, timeToText } from '../src/utils/playbackRange';

// A trip going east: drive 4 points, stand still for 10 minutes, drive 3 more points.
const point = (timestamp, lng, speed) => ({ timestamp, lat: 24, lng, speed, course: 90 });
const trip = [
  point(1000, 90.0, 30),
  point(1060, 90.005, 40),
  point(1120, 90.01, 40),
  point(1180, 90.015, 0), // stops here
  point(1480, 90.015, 0),
  point(1780, 90.015, 0), // 600 s standing still
  point(1840, 90.02, 35), // moves again
  point(1900, 90.025, 35),
  point(1960, 90.03, 0),
];

describe('findStops', () => {
  it('finds a long pause and ignores a short one', () => {
    const stops = findStops(trip);
    expect(stops).toHaveLength(1);
    expect(stops[0].seconds).toBeGreaterThanOrEqual(MIN_STOP_SECONDS);
    expect(stops[0].startTime).toBe(1180);
    expect(stops[0].endTime).toBe(1840); // lasted until it moved again
  });
  it('has no stops for a short pause', () => {
    const shortPause = [point(0, 90, 30), point(60, 90.001, 0), point(120, 90.001, 0), point(180, 90.002, 30)];
    expect(findStops(shortPause)).toEqual([]);
  });
});

describe('summarizeTrip', () => {
  it('adds distance, driving and parking time', () => {
    const summary = summarizeTrip(trip);
    expect(summary.distanceKm).toBeCloseTo(3.05, 1); // 0.03 degrees of longitude at 24N is about 3 km
    expect(summary.parkingSeconds).toBe(660);
    expect(summary.drivingSeconds).toBe(60 * 3 + 60 * 2); // moving intervals only
    expect(summary.maxSpeedKmh).toBe(40);
    expect(summary.startTime).toBe(1000);
    expect(summary.endTime).toBe(1960);
  });
  it('handles an empty trip', () => {
    expect(summarizeTrip([]).distanceKm).toBe(0);
  });
});

describe('positionAt', () => {
  it('stays inside the trip', () => {
    expect(positionAt(trip, 0).index).toBe(0);
    expect(positionAt(trip, 9999).index).toBe(trip.length - 1);
  });
  it('moves smoothly between two points and faces east', () => {
    const middle = positionAt(trip, 1030); // half way between the first two points
    expect(middle.index).toBe(0);
    expect(middle.longitude).toBeCloseTo(90.0025, 5);
    expect(Math.round(middle.heading)).toBe(90);
  });
});

describe('buildTimeline', () => {
  it('lists start, parked, resumed and end in order', () => {
    const items = buildTimeline(trip, findStops(trip));
    expect(items.map((item) => item.type)).toEqual(['start', 'park', 'resume', 'end']);
    expect(items[1].detail).toContain('11m parked');
    expect(items[3].detail).toContain('km travelled');
  });
  it('has no "resumed" when the trip ends parked', () => {
    const endsParked = [point(0, 90, 30), point(60, 90.001, 0), point(400, 90.001, 0)];
    const items = buildTimeline(endsParked, findStops(endsParked));
    expect(items.map((item) => item.type)).toEqual(['start', 'park', 'end']);
  });
});

describe('cumulativeKm and formatDuration', () => {
  it('starts at zero and grows', () => {
    const km = cumulativeKm(trip);
    expect(km[0]).toBe(0);
    expect(km[km.length - 1]).toBeGreaterThan(km[1]);
  });
  it('formats durations', () => {
    expect(formatDuration(9780)).toBe('2h 43m');
    expect(formatDuration(1020)).toBe('17m');
    expect(formatDuration(45)).toBe('45s');
  });
});

describe('playback ranges', () => {
  // 2026-10-07 20:00 UTC is 08 Oct 02:00 in Bangladesh
  const nowMs = Date.UTC(2026, 9, 7, 20, 0, 0);

  it('uses the Bangladesh date for today, yesterday and the last 7 days', () => {
    expect(getPresetRange('today', nowMs)).toEqual({ fromDate: '2026-10-08', toDate: '2026-10-08', fromTime: '00:00', toTime: '23:59' });
    expect(getPresetRange('yesterday', nowMs).fromDate).toBe('2026-10-07');
    expect(getPresetRange('week', nowMs)).toMatchObject({ fromDate: '2026-10-02', toDate: '2026-10-08' });
  });
  it('formats picked times and describes the range', () => {
    expect(timeToText({ hours: 8, minutes: 5 })).toBe('08:05');
    expect(describeRange(getPresetRange('today', nowMs))).toBe('08 Oct 2026 · 00:00 – 23:59');
  });
  it('detects a backwards range and builds a key', () => {
    expect(isRangeBackwards({ fromDate: '2026-10-08', toDate: '2026-10-07', fromTime: '00:00', toTime: '23:59' })).toBe(true);
    expect(isRangeBackwards({ fromDate: '2026-10-08', toDate: '2026-10-08', fromTime: '08:00', toTime: '11:00' })).toBe(false);
    expect(rangeKey(2, getPresetRange('today', nowMs))).toBe('2|2026-10-08|2026-10-08|00:00|23:59');
  });
});
