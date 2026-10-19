// Smooth live movement of a vehicle on the map, the way ride-hailing apps do it.
//
// Live positions arrive every 10-30 s, and unevenly. Gliding to each one as it arrives makes the marker stop at every
// point, wait, then lurch on. Instead the marker drives along the received points on its own, a little behind live:
// at the vehicle's average speed (distance / time of the last few positions), gently faster when it has fallen behind
// and slower when it is about to catch up with the newest point. So it keeps moving at an even speed, and only stops
// when the vehicle really stops sending new places.
// Pure logic, no React (tested in __tests__/liveRoute.test.js).
import { distanceMeters } from './heading';

export const MIN_DELAY_MS = 2000;
export const MAX_DELAY_MS = 45000;
export const DEFAULT_DELAY_MS = 12000; // until the tracker's own rhythm is known
export const DELAY_MARGIN = 1.25; // stay this much behind the slowest recent gap
export const SILENCE_MS = 90000; // a longer pause (parked) is not a gap between driving positions
export const JUMP_METERS = 2000; // farther than this is not driving (reconnect, GPS jump): go there at once
const RECENT_POINTS = 5;
// Chosen by simulating trackers that send every 10 s, unevenly every 9-20 s, every 30 s, and one that is 25 s late:
// the marker never stops in any of them, and at a steady rhythm its speed stays within about 5 % of the vehicle's.
export const TUNING = {
  minPace: 0.3, // how much slower / faster than the vehicle's speed the marker may go to keep its distance
  maxPace: 1.6,
  paceExponent: 0.5, // how strongly the distance left changes the pace
  bufferShare: 1.2, // the road to keep ahead, as a share of (vehicle speed x delay)
  smoothingS: 3, // the marker's speed changes over about this long, never in a jump
};
const MAX_FRAME_S = 1; // a longer pause between frames (app in the background) is not played as movement
const ARRIVED_METERS = 0.3;

const clamp = (value, low, high) => Math.min(Math.max(value, low), high);
const copy = (point) => ({ latitude: point.latitude, longitude: point.longitude });

/** The point `meters` along the line from `from` to `to`. */
function along(from, to, meters) {
  const length = distanceMeters(from, to);
  const share = length > 0 ? clamp(meters / length, 0, 1) : 1;
  return {
    latitude: from.latitude + (to.latitude - from.latitude) * share,
    longitude: from.longitude + (to.longitude - from.longitude) * share,
  };
}

export class LiveRoute {
  /**
   * @param {{ latitude: number, longitude: number }} point The first position
   * @param {number} nowMs
   */
  constructor(point, nowMs) {
    this.points = [copy(point)]; // points[0] = start of the stretch the marker is on, then the ones still ahead
    this.offset = 0; // meters the marker has gone from points[0] toward points[1]
    this.speed = 0; // the marker's speed, m/s
    this.recent = []; // [{ gap (ms), meters }] of the last positions
    this.delay = DEFAULT_DELAY_MS;
    this.lastArrivalAt = nowMs;
    this.lastFrameAt = nowMs;
  }

  /** Where the marker is now. */
  position() {
    return this.points.length > 1 ? along(this.points[0], this.points[1], this.offset) : copy(this.points[0]);
  }

  /** The point the marker is driving toward (the vehicle picture faces it). */
  headingTarget() {
    return copy(this.points[1] || this.points[0]);
  }

  /** Meters left from the marker to the newest point. */
  remaining() {
    let meters = 0;
    for (let index = 0; index < this.points.length - 1; index += 1) {
      meters += distanceMeters(this.points[index], this.points[index + 1]);
    }
    return Math.max(0, meters - this.offset);
  }

  /** The vehicle's average speed over the last positions, m/s (0 while unknown). */
  vehicleSpeed() {
    const time = this.recent.reduce((total, item) => total + item.gap, 0);
    const meters = this.recent.reduce((total, item) => total + item.meters, 0);
    return time > 0 ? meters / (time / 1000) : 0;
  }

  /**
   * A new live position.
   * @returns {boolean} true when it is a jump: the marker was moved there at once (no driving)
   */
  add(point, nowMs) {
    if (distanceMeters(this.position(), point) > JUMP_METERS) {
      this.points = [copy(point)];
      this.offset = 0;
      this.speed = 0;
      this.recent = [];
      this.lastArrivalAt = nowMs;
      return true;
    }
    const newest = this.points[this.points.length - 1];
    const gap = nowMs - this.lastArrivalAt;
    if (gap > 0 && gap <= SILENCE_MS) {
      this.recent = [...this.recent, { gap, meters: distanceMeters(newest, point) }].slice(-RECENT_POINTS);
      this.delay = clamp(Math.max(...this.recent.map((item) => item.gap)) * DELAY_MARGIN, MIN_DELAY_MS, MAX_DELAY_MS);
    }
    this.lastArrivalAt = nowMs;
    this.points.push(copy(point));
    return false;
  }

  /**
   * Move the marker on to `nowMs`.
   * @returns {{ position, reached: Array, headingChanged: boolean }} reached = points the marker passed (for the trail)
   */
  frame(nowMs) {
    const dt = clamp((nowMs - this.lastFrameAt) / 1000, 0, MAX_FRAME_S);
    this.lastFrameAt = nowMs;
    const reached = [];
    const remaining = this.remaining();

    if (remaining < ARRIVED_METERS) {
      // At the newest point (or a hair from it): stand exactly on it and wait there for the next one
      this.speed = 0;
      while (this.points.length > 1) {
        this.points.shift();
        reached.push(copy(this.points[0]));
      }
      this.offset = 0;
    } else {
      const delayS = this.delay / 1000;
      const vehicle = this.vehicleSpeed() || remaining / delayS;
      // Keep about `delay` worth of road ahead: faster when far behind, slower when close to the newest point
      const buffer = Math.max(vehicle * delayS * TUNING.bufferShare, 1);
      const pace = clamp((remaining / buffer) ** TUNING.paceExponent, TUNING.minPace, TUNING.maxPace);
      const wanted = vehicle * pace;
      this.speed += (wanted - this.speed) * Math.min(1, dt / TUNING.smoothingS);
      let step = Math.min(Math.max(this.speed, 0) * dt, remaining);

      // Walk along the stretches, passing points on the way
      while (step > 0 && this.points.length > 1) {
        const left = distanceMeters(this.points[0], this.points[1]) - this.offset;
        if (step < left) {
          this.offset += step;
          step = 0;
        } else {
          step -= left;
          this.points.shift();
          this.offset = 0;
          reached.push(copy(this.points[0]));
        }
      }
    }
    return { position: this.position(), reached, headingChanged: reached.length > 0 };
  }
}
