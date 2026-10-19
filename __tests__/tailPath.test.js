// The vehicle tail: driving order, no repeated points, no zig-zag when the server tail and live points overlap.
import { attachTailToMarker, buildTailPath, distanceMeters, orderTail } from '../src/utils/tailPath';

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

describe('attachTailToMarker', () => {
  // A straight road north, about 110 m between points
  const road = (n) => ({ latitude: 24.85 + n * 0.001, longitude: 89.37 });

  it('cuts the part the marker has not driven yet and ends the line at the marker', () => {
    const marker = { latitude: 24.8525, longitude: 89.37 }; // between points 2 and 3
    const path = [road(0), road(1), road(2), road(3), road(4)];
    expect(attachTailToMarker(path, marker, road(4))).toEqual([road(0), road(1), road(2), marker]);
  });

  it('just adds the marker when it is already at the newest point', () => {
    const path = [road(0), road(1), road(2)];
    expect(attachTailToMarker(path, road(2), road(2))).toEqual([road(0), road(1), road(2)]);
  });

  it('leaves the line alone when the marker is not known yet', () => {
    const path = [road(0), road(1)];
    expect(attachTailToMarker(path, null, road(1))).toBe(path);
  });
});
