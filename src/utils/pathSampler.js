// Helpers for a road made of connected cubic bezier curves: SVG path text and points along it.
// A curve is { c1: [x, y], c2: [x, y], end: [x, y] }; the first curve starts at `start`.

function cubicPoint(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    u * u * u * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t * t * t * p3[0],
    u * u * u * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t * t * t * p3[1],
  ];
}

// Direction of travel at t (derivative of the curve)
function cubicDirection(p0, p1, p2, p3, t) {
  const u = 1 - t;
  return [
    3 * u * u * (p1[0] - p0[0]) + 6 * u * t * (p2[0] - p1[0]) + 3 * t * t * (p3[0] - p2[0]),
    3 * u * u * (p1[1] - p0[1]) + 6 * u * t * (p2[1] - p1[1]) + 3 * t * t * (p3[1] - p2[1]),
  ];
}

/** SVG path text ("M x y C ...") for the whole road. */
export function buildPathData(start, curves) {
  const parts = [`M${start[0]} ${start[1]}`];
  curves.forEach((curve) => {
    parts.push(`C${curve.c1[0]} ${curve.c1[1]} ${curve.c2[0]} ${curve.c2[1]} ${curve.end[0]} ${curve.end[1]}`);
  });
  return parts.join(' ');
}

/**
 * Points along the road, from start to end, with the heading in degrees (0 = pointing right).
 * @returns {Array<{x: number, y: number, angle: number}>}
 */
export function samplePath(start, curves, samplesPerCurve) {
  const points = [];
  let from = start;
  curves.forEach((curve, curveIndex) => {
    for (let step = 0; step <= samplesPerCurve; step += 1) {
      const isDuplicateJoin = curveIndex > 0 && step === 0;
      if (!isDuplicateJoin) {
        const t = step / samplesPerCurve;
        const [x, y] = cubicPoint(from, curve.c1, curve.c2, curve.end, t);
        const [dx, dy] = cubicDirection(from, curve.c1, curve.c2, curve.end, t);
        points.push({ x, y, angle: (Math.atan2(dy, dx) * 180) / Math.PI });
      }
    }
    from = curve.end;
  });
  return points;
}
