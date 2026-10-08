import { bearingDegrees, distanceMeters, MIN_MOVE_METERS, nextHeading, shortestTurn } from '../src/utils/heading';

const origin = { latitude: 24, longitude: 90 };

describe('bearingDegrees', () => {
  it('points north, east, south and west', () => {
    expect(Math.round(bearingDegrees(origin, { latitude: 24.001, longitude: 90 }))).toBe(0);
    expect(Math.round(bearingDegrees(origin, { latitude: 24, longitude: 90.001 }))).toBe(90);
    expect(Math.round(bearingDegrees(origin, { latitude: 23.999, longitude: 90 }))).toBe(180);
    expect(Math.round(bearingDegrees(origin, { latitude: 24, longitude: 89.999 }))).toBe(270);
  });
});

describe('nextHeading', () => {
  it('follows the direction of travel after a real move', () => {
    const moved = { latitude: 24, longitude: 89.999 }; // about 100 m west
    expect(Math.round(nextHeading(origin, moved, 344))).toBe(270);
  });
  it('keeps the old heading for GPS jitter or the first point', () => {
    const jitter = { latitude: 24.00001, longitude: 90 }; // about 1 m
    expect(distanceMeters(origin, jitter)).toBeLessThan(MIN_MOVE_METERS);
    expect(nextHeading(origin, jitter, 344)).toBe(344);
    expect(nextHeading(null, origin, 12)).toBe(12);
  });
});

describe('shortestTurn', () => {
  it('turns the short way around', () => {
    expect(shortestTurn(350, 10)).toBe(20);
    expect(shortestTurn(10, 350)).toBe(-20);
    expect(shortestTurn(90, 270)).toBe(-180);
    expect(shortestTurn(45, 45)).toBe(0);
  });
});
