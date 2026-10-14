// Maths for the speedometer on the vehicle details page. Pure functions.
// A position on the dial is a "fraction": 0 = the left end (0 km/h), 1 = the right end (the top speed of the dial).

/** The speed at the right end of the dial. A faster vehicle just keeps the needle at the end. */
export const GAUGE_MAX_SPEED = 160;

/** Colored zones of the dial, as fractions of the dial: [from, to, color token name]. */
export const GAUGE_ZONES = [
  { from: 0, to: 0.4, tone: 'ok' }, // 0 - 64 km/h
  { from: 0.4, to: 0.65, tone: 'warn' }, // 64 - 104 km/h
  { from: 0.65, to: 1, tone: 'danger' }, // 104 km/h and over
];

/** 0..1 for a speed in km/h. Negative, missing or not-a-number speeds are 0; speeds above the dial are 1. */
export function getGaugeFraction(speed, maxSpeed = GAUGE_MAX_SPEED) {
  const value = Number(speed);
  if (!Number.isFinite(value) || value <= 0) {
    return 0;
  }
  return Math.min(value / maxSpeed, 1);
}

/** The needle's turn in degrees: -90 points to the left end, 0 straight up, +90 the right end. */
export function getNeedleDegrees(fraction) {
  return -90 + fraction * 180;
}

/** A point on the upper half of a circle: fraction 0 is the left end, 0.5 the top, 1 the right end. */
export function getArcPoint(centerX, centerY, radius, fraction) {
  const angle = Math.PI * (1 - fraction);
  return { x: centerX + radius * Math.cos(angle), y: centerY - radius * Math.sin(angle) };
}

/** SVG path of a piece of the dial, from one fraction to another (drawn left to right over the top). */
export function getArcPath(centerX, centerY, radius, fromFraction, toFraction) {
  const start = getArcPoint(centerX, centerY, radius, fromFraction);
  const end = getArcPoint(centerX, centerY, radius, toFraction);
  const round = (number) => Math.round(number * 100) / 100;
  return `M ${round(start.x)} ${round(start.y)} A ${radius} ${radius} 0 0 1 ${round(end.x)} ${round(end.y)}`;
}
