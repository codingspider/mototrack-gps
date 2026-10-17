// The vehicle tail: driving order, no repeated points, no zig-zag when the server tail and live points overlap.
import { buildTailPath, distanceMeters, orderTail } from '../src/utils/tailPath';

const p = (latitude, longitude) => ({ latitude, longitude });
// Points about 110 m apart, driving north
const A = { lat: '24.8000', lng: '89.3500' };
const B = { lat: '24.8010', lng: '89.3500' };
const C = { lat: '24.8020', lng: '89.3500' };

describe('distanceMeters', () => {
  it('measures about 111 m for 0.001 degree of latitude', () => {
    expect(Math.round(distanceMeters(p(24.8, 89.35), p(24.801, 89.35)))).toBe(111);
  });
});

describe('orderTail', () => {
  it('keeps a tail that is already oldest first', () => {
    expect(orderTail([A, B, C], p(24.803, 89.35))).toEqual([p(24.8, 89.35), p(24.801, 89.35), p(24.802, 89.35)]);
  });

  it('turns a newest-first tail around', () => {
    expect(orderTail([C, B, A], p(24.803, 89.35))).toEqual([p(24.8, 89.35), p(24.801, 89.35), p(24.802, 89.35)]);
  });

  it('drops missing and 0,0 points', () => {
    expect(orderTail([A, { lat: 0, lng: 0 }, null, B], null)).toEqual([p(24.8, 89.35), p(24.801, 89.35)]);
  });
});

describe('buildTailPath', () => {
  const tail = [p(24.8, 89.35), p(24.801, 89.35), p(24.802, 89.35)];

  it('adds the live points after the tail', () => {
    expect(buildTailPath(tail, [p(24.803, 89.35)])).toEqual([...tail, p(24.803, 89.35)]);
  });

  it('does not add again live points the tail already has (no zig-zag)', () => {
    const live = [p(24.801, 89.35), p(24.802, 89.35), p(24.803, 89.35)];
    expect(buildTailPath(tail, live)).toEqual([...tail, p(24.803, 89.35)]);
  });

  it('skips points closer than 5 m (GPS noise)', () => {
    expect(buildTailPath(tail, [p(24.80201, 89.35)])).toEqual(tail);
  });

  it('works with only live points', () => {
    expect(buildTailPath([], [p(24.8, 89.35), p(24.801, 89.35)])).toEqual([p(24.8, 89.35), p(24.801, 89.35)]);
  });
});
