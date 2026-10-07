// Isometric (2:1) box drawing helpers. Pure functions that return SVG polygon "points" text.
// (x, y) is the front-bottom corner. w runs to the left-back, d runs to the right-back, h goes up.

const toPoints = (list) => list.map(([px, py]) => `${px},${py}`).join(' ');

/** The three visible faces of a box: { left, right, top }. */
export function isoBoxFaces(x, y, w, d, h) {
  return {
    left: toPoints([
      [x, y],
      [x - w, y - w / 2],
      [x - w, y - w / 2 - h],
      [x, y - h],
    ]),
    right: toPoints([
      [x, y],
      [x + d, y - d / 2],
      [x + d, y - d / 2 - h],
      [x, y - h],
    ]),
    top: toPoints([
      [x, y - h],
      [x - w, y - w / 2 - h],
      [x - w + d, y - (w + d) / 2 - h],
      [x + d, y - d / 2 - h],
    ]),
  };
}

/**
 * A grid of windows on one face.
 * @param {'left'|'right'} side Which face
 * @param {number} span Face width (w for the left face, d for the right face)
 * @returns {string[]} one polygon "points" text per window
 */
export function isoWindows(side, x, y, span, h, cols, rows) {
  const direction = side === 'left' ? -1 : 1;
  const marginX = span * 0.12;
  const marginY = h * 0.1;
  const cellW = (span - marginX * 2) / cols;
  const cellH = (h - marginY * 2) / rows;
  const windows = [];

  for (let row = 0; row < rows; row += 1) {
    for (let col = 0; col < cols; col += 1) {
      const u0 = marginX + col * cellW + cellW * 0.2;
      const u1 = marginX + col * cellW + cellW * 0.8;
      const v0 = marginY + row * cellH + cellH * 0.2;
      const v1 = marginY + row * cellH + cellH * 0.8;
      const point = (u, v) => [x + direction * u, y - u / 2 - v];
      windows.push(toPoints([point(u0, v0), point(u1, v0), point(u1, v1), point(u0, v1)]));
    }
  }
  return windows;
}
