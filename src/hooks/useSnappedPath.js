// Makes the vehicle tail follow the roads: asks Google Roads API to snap the raw GPS path, at most once every
// SNAP_EVERY_MS and only when new points arrived (it is billed per request). Until an answer arrives, or when it
// fails (no key, Roads API not enabled, no internet), the raw path is drawn, so the tail never disappears.
import { useEffect, useRef, useState } from 'react';
import { snapToRoads } from '../api/roadsApi';

const SNAP_EVERY_MS = 20 * 1000;
const RETRY_AFTER_FAILURE_MS = 5 * 60 * 1000; // after an error, wait before asking Google again

/**
 * @param {{ latitude: number, longitude: number }[]} rawPath Tail in driving order (from buildTailPath)
 * @param {boolean} isEnabled False while the tail is hidden (then nothing is asked from Google)
 * @returns {{ latitude: number, longitude: number }[]} The path to draw
 */
export default function useSnappedPath(rawPath, isEnabled) {
  const [snapped, setSnapped] = useState(null); // { lastRaw, points }: lastRaw = the newest raw point that was snapped
  const lastAskedAt = useRef(0);
  const lastAskedKey = useRef('');
  const blockedUntil = useRef(0);
  const latestPath = useRef(rawPath);
  latestPath.current = rawPath;

  useEffect(() => {
    if (!isEnabled || rawPath.length < 2) {
      return undefined;
    }
    if (pointKey(rawPath[rawPath.length - 1]) === lastAskedKey.current || Date.now() < blockedUntil.current) {
      return undefined;
    }
    let isActive = true;
    const wait = Math.max(0, lastAskedAt.current + SNAP_EVERY_MS - Date.now());
    const timer = setTimeout(async () => {
      const path = latestPath.current;
      const lastRaw = path[path.length - 1];
      lastAskedAt.current = Date.now();
      lastAskedKey.current = pointKey(lastRaw);
      try {
        const points = await snapToRoads(path);
        if (isActive && points.length > 1) {
          setSnapped({ lastRaw, points });
        }
      } catch (error) {
        blockedUntil.current = Date.now() + RETRY_AFTER_FAILURE_MS;
        __DEV__ && console.log('Snap to roads failed:', error.message);
      }
    }, wait);
    return () => {
      isActive = false;
      clearTimeout(timer);
    };
  }, [rawPath, isEnabled]);

  if (!isEnabled || !snapped || snapped.points.length < 2) {
    return rawPath;
  }
  // Raw points that arrived after the last snap are joined to the snapped part, so the tail reaches the vehicle
  const snappedEnd = rawPath.findIndex((point) => pointKey(point) === pointKey(snapped.lastRaw));
  if (snappedEnd === -1) {
    return rawPath; // the path changed completely (e.g. reloaded): draw it raw until the next snap
  }
  return [...snapped.points, ...rawPath.slice(snappedEnd + 1)];
}

/** A point as text, to compare points without float noise. */
function pointKey(point) {
  return point ? `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}` : '';
}
