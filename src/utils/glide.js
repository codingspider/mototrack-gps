// How long the vehicle marker glides to a new live position. The glide lasts a little longer than the usual time
// between two positions, so the next one arrives while the marker is still moving: it drives on smoothly instead of
// stopping at every point and waiting. Pure functions (tested in __tests__/glide.test.js).
import { distanceMeters } from './heading';

export const MIN_GLIDE_MS = 1000;
export const MAX_GLIDE_MS = 30000; // trackers send every 10-30 s while driving
export const DEFAULT_GAP_MS = 10000; // the gap assumed after a long silence (parked, reconnecting)
export const GLIDE_STRETCH = 1.15; // glide 15 % longer than the gap, so the marker never runs out of road
export const JUMP_METERS = 2000; // farther than this is not driving (a reconnect, a GPS jump): get there quickly

/**
 * The new average time between positions.
 * @param {number} averageGapMs The average so far
 * @param {number} gapMs Time since the previous position
 */
export function nextAverageGap(averageGapMs, gapMs) {
  if (!(gapMs > 0) || gapMs > MAX_GLIDE_MS) {
    return DEFAULT_GAP_MS; // a long silence says nothing about the driving rhythm
  }
  return averageGapMs * 0.6 + gapMs * 0.4;
}

/**
 * Glide time to the new position.
 * @param {number} averageGapMs From nextAverageGap
 * @param {{latitude, longitude}|null} from Where the marker is now
 * @param {{latitude, longitude}} to The new position
 */
export function getGlideMs(averageGapMs, from, to) {
  if (from && distanceMeters(from, to) > JUMP_METERS) {
    return MIN_GLIDE_MS;
  }
  return Math.round(Math.min(Math.max(averageGapMs * GLIDE_STRETCH, MIN_GLIDE_MS), MAX_GLIDE_MS));
}
