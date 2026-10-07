import { buildPathData, samplePath } from '../src/utils/pathSampler';
import { isoBoxFaces, isoWindows } from '../src/utils/isometric';

describe('pathSampler', () => {
  const start = [0, 0];
  const curves = [{ c1: [10, 0], c2: [20, 0], end: [30, 0] }];

  it('builds SVG path text', () => {
    expect(buildPathData(start, curves)).toBe('M0 0 C10 0 20 0 30 0');
  });
  it('starts and ends on the road ends, heading right for a flat road', () => {
    const points = samplePath(start, curves, 10);
    expect(points).toHaveLength(11);
    expect(points[0]).toMatchObject({ x: 0, y: 0, angle: 0 });
    expect(points[10].x).toBeCloseTo(30);
  });
  it('does not repeat the point where two curves join', () => {
    const twoCurves = [...curves, { c1: [40, 0], c2: [50, 0], end: [60, 0] }];
    expect(samplePath(start, twoCurves, 10)).toHaveLength(21);
  });
});

describe('isometric', () => {
  it('builds the three faces of a box', () => {
    const faces = isoBoxFaces(100, 100, 20, 20, 40);
    expect(faces.left).toBe('100,100 80,90 80,50 100,60');
    expect(faces.right).toBe('100,100 120,90 120,50 100,60');
    expect(faces.top).toBe('100,60 80,50 100,40 120,50');
  });
  it('makes cols x rows windows', () => {
    expect(isoWindows('left', 100, 100, 20, 40, 3, 4)).toHaveLength(12);
  });
});
