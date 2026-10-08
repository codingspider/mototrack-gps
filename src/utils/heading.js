// Heading helpers for the vehicle marker. Angles are compass degrees: 0 = north, 90 = east.

export const MIN_MOVE_METERS = 5; // smaller moves are GPS jitter, not real driving
const METERS_PER_DEGREE = 111320;

/** Meters between two close points (good enough for the few meters between live updates). */
export function distanceMeters(from, to) {
  const dy = (to.latitude - from.latitude) * METERS_PER_DEGREE;
  const dx = (to.longitude - from.longitude) * METERS_PER_DEGREE * Math.cos((to.latitude * Math.PI) / 180);
  return Math.sqrt(dx * dx + dy * dy);
}

/** Compass bearing from one point to the next, 0..359. */
export function bearingDegrees(from, to) {
  const dy = to.latitude - from.latitude;
  const dx = (to.longitude - from.longitude) * Math.cos((to.latitude * Math.PI) / 180);
  return (((Math.atan2(dx, dy) * 180) / Math.PI) % 360 + 360) % 360;
}

/**
 * The heading to show after a new position: the direction of travel when the vehicle really moved,
 * otherwise the heading it already had (a parked vehicle keeps facing the same way).
 */
export function nextHeading(previousPoint, newPoint, currentHeading) {
  if (previousPoint && distanceMeters(previousPoint, newPoint) >= MIN_MOVE_METERS) {
    return bearingDegrees(previousPoint, newPoint);
  }
  return currentHeading;
}

/** Shortest signed turn from one heading to another, -180..180 (so 350 -> 10 is +20, not -340). */
export function shortestTurn(from, to) {
  return ((((to - from) % 360) + 540) % 360) - 180;
}
