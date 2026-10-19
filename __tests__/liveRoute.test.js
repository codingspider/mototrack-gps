// The live route: the vehicle marker keeps moving at an even speed between uneven live positions.
import { DEFAULT_DELAY_MS, JUMP_METERS, LiveRoute } from '../src/utils/liveRoute';
import { distanceMeters } from '../src/utils/heading';
import { keepNewerLivePosition } from '../src/store/slices/vehiclesSlice';

const start = { latitude: 24.85, longitude: 89.37 };
// About 110 m north per step
const step = (n) => ({ latitude: 24.85 + n * 0.001, longitude: 89.37 });

/** Runs the marker clock from `fromMs` to `toMs` in 40 ms frames; returns the positions it showed. */
function play(route, fromMs, toMs) {
  const shown = [];
  for (let t = fromMs; t <= toMs; t += 40) {
    shown.push(route.frame(t).position);
  }
  return shown;
}

describe('LiveRoute', () => {
  it('never stops between positions that keep coming, even when they come unevenly', () => {
    const route = new LiveRoute(start, 0);
    // The tracker reports after 10 s, 18 s, 12 s, 20 s, 15 s ...
    const arrivals = [10000, 28000, 40000, 60000, 75000, 90000, 102000, 120000];
    let now = 0;
    let stoppedFrames = 0;
    let movingFrames = 0;
    arrivals.forEach((arrival, index) => {
      const shown = play(route, now, arrival - 1);
      for (let i = 1; i < shown.length; i += 1) {
        const moved = distanceMeters(shown[i - 1], shown[i]);
        if (moved < 0.01) {
          stoppedFrames += 1;
        } else {
          movingFrames += 1;
        }
      }
      route.add(step(index + 1), arrival);
      now = arrival;
    });
    // While it learns the rhythm it waits a little at the start; once the positions come, it keeps moving
    const late = play(route, now, now + 15000);
    const lateStops = late.slice(1).filter((p, i) => distanceMeters(late[i], p) < 0.01).length;
    expect(movingFrames).toBeGreaterThan(stoppedFrames * 3);
    expect(lateStops).toBe(0);
  });

  it('keeps an even speed, and does not stop even when one position comes late', () => {
    const route = new LiveRoute(start, 0);
    const metersPerSecond = 8; // about 30 km/h
    const gaps = [15000, 15000, 15000, 15000, 15000, 15000, 40000, 15000, 15000, 15000, 15000, 15000];
    let now = 0;
    let latitude = start.latitude;
    let previous = route.position();
    const speeds = [];
    gaps.forEach((gap) => {
      for (let t = now; t < now + gap; t += 40) {
        const p = route.frame(t).position;
        if (t > 60000) {
          speeds.push(distanceMeters(previous, p) / 0.04);
        }
        previous = p;
      }
      now += gap;
      latitude += (metersPerSecond * gap) / 1000 / 111320;
      route.add({ latitude, longitude: start.longitude }, now);
    });
    expect(speeds.filter((speed) => speed < 0.1)).toHaveLength(0); // it never stopped
    const steady = speeds.slice(0, 15 * 25); // the part before the late position
    expect(Math.max(...steady) / metersPerSecond).toBeLessThan(1.25);
    expect(Math.min(...steady) / metersPerSecond).toBeGreaterThan(0.75);
  });

  it('never moves backwards', () => {
    const route = new LiveRoute(start, 0);
    let now = 0;
    let previous = route.position();
    [8000, 30000, 33000, 60000, 61000, 90000].forEach((arrival, index) => {
      play(route, now, arrival - 1).forEach((p) => {
        expect(p.latitude).toBeGreaterThanOrEqual(previous.latitude - 1e-12);
        previous = p;
      });
      route.add(step(index + 1), arrival);
      now = arrival;
    });
  });

  it('waits at the newest point when the vehicle stops sending new places', () => {
    const route = new LiveRoute(start, 0);
    route.add(step(1), 10000);
    play(route, 0, 10000 + DEFAULT_DELAY_MS * 3);
    expect(route.position()).toEqual({ latitude: step(1).latitude, longitude: step(1).longitude });
  });

  it('starts driving again after a long stop without replaying the stop', () => {
    const route = new LiveRoute(start, 0);
    route.add(step(1), 10000);
    play(route, 0, 300000); // parked for minutes
    route.add(step(2), 300000);
    const shown = play(route, 300000, 300000 + 5000);
    expect(distanceMeters(shown[0], shown[shown.length - 1])).toBeGreaterThan(10); // it is moving again
  });

  it('jumps straight to a far point (reconnect or GPS jump)', () => {
    const route = new LiveRoute(start, 0);
    const far = { latitude: 24.85 + (JUMP_METERS * 2) / 111320, longitude: 89.37 };
    expect(route.add(far, 5000)).toBe(true);
    expect(route.position()).toEqual(far);
  });

  it('tells which places the marker has passed, for the trail', () => {
    const route = new LiveRoute(start, 0);
    route.add(step(1), 10000);
    route.add(step(2), 20000);
    const passed = [];
    for (let t = 0; t <= 60000; t += 40) {
      passed.push(...route.frame(t).reached);
    }
    expect(passed).toEqual([
      { latitude: step(1).latitude, longitude: step(1).longitude },
      { latitude: step(2).latitude, longitude: step(2).longitude },
    ]);
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

  it('takes the list when it is newer, or when the live socket has gone quiet', () => {
    expect(keepNewerLivePosition(live, { last_position_stamp: now - 1 }, nowMs)).toEqual({});
    const stale = { ...live, last_position_stamp: now - 600 };
    expect(keepNewerLivePosition(stale, { last_position_stamp: now - 6 * 3600 }, nowMs)).toEqual({});
    expect(keepNewerLivePosition({}, { last_position_stamp: now - 20 }, nowMs)).toEqual({});
  });
});
