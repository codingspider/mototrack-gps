// The vehicle marker glide: long enough that the next live position arrives while the marker is still moving.
import { DEFAULT_GAP_MS, getGlideMs, MAX_GLIDE_MS, MIN_GLIDE_MS, nextAverageGap } from '../src/utils/glide';
import { keepNewerLivePosition } from '../src/store/slices/vehiclesSlice';

const here = { latitude: 24.85, longitude: 89.37 };
const near = { latitude: 24.851, longitude: 89.37 }; // about 110 m
const far = { latitude: 24.9, longitude: 89.37 }; // about 5.5 km

describe('nextAverageGap', () => {
  it('follows the rhythm of the tracker', () => {
    expect(nextAverageGap(10000, 20000)).toBe(14000);
    expect(nextAverageGap(15000, 15000)).toBe(15000);
  });

  it('starts over after a long silence', () => {
    expect(nextAverageGap(15000, 5 * 60 * 1000)).toBe(DEFAULT_GAP_MS);
    expect(nextAverageGap(15000, 0)).toBe(DEFAULT_GAP_MS);
  });
});

describe('getGlideMs', () => {
  it('glides a little longer than the gap, so the marker is still moving when the next position comes', () => {
    expect(getGlideMs(20000, here, near)).toBe(23000);
    expect(getGlideMs(20000, here, near)).toBeGreaterThan(20000);
  });

  it('stays between the shortest and the longest glide', () => {
    expect(getGlideMs(100, here, near)).toBe(MIN_GLIDE_MS);
    expect(getGlideMs(60000, here, near)).toBe(MAX_GLIDE_MS);
  });

  it('gets there quickly after a jump (reconnect, GPS jump)', () => {
    expect(getGlideMs(20000, here, far)).toBe(MIN_GLIDE_MS);
  });
});

describe('keepNewerLivePosition', () => {
  const nowMs = 1_800_000_000_000;
  const now = nowMs / 1000;
  const live = { lat: '24.86', lng: '89.38', live_speed: 40, course: 90, last_position_stamp: now - 5 };

  it('keeps the newer live position over an older list', () => {
    expect(keepNewerLivePosition(live, { lat: '24.85', last_position_stamp: now - 20 }, nowMs)).toEqual({
      lat: '24.86',
      lng: '89.38',
      live_speed: 40,
      course: 90,
      last_position_stamp: now - 5,
    });
  });

  it('takes the list when it is newer', () => {
    expect(keepNewerLivePosition(live, { last_position_stamp: now - 1 }, nowMs)).toEqual({});
  });

  it('takes the list when the live socket has gone quiet', () => {
    const stale = { ...live, last_position_stamp: now - 600 };
    expect(keepNewerLivePosition(stale, { last_position_stamp: now - 6 * 3600 }, nowMs)).toEqual({});
  });

  it('takes the list when there is no live position', () => {
    expect(keepNewerLivePosition({}, { last_position_stamp: now - 20 }, nowMs)).toEqual({});
  });
});
