// The tail behind a vehicle on its map: the server's recent points (details.tail) plus the live points that arrived
// since the page opened, in driving order, without the back-and-forth zig-zag. Pure functions.

const METERS_PER_DEGREE = 111320;
const SAME_POINT_METERS = 5; // closer than this = the same point (GPS noise while slow or stopped)

/** Rough distance in meters between two { latitude, longitude } points (fine for a few km). */
export function distanceMeters(a, b) {
  const latMeters = (a.latitude - b.latitude) * METERS_PER_DEGREE;
  const lngMeters = (a.longitude - b.longitude) * METERS_PER_DEGREE * Math.cos((a.latitude * Math.PI) / 180);
  return Math.sqrt(latMeters * latMeters + lngMeters * lngMeters);
}

/** { lat, lng } from the server (text or numbers) to { latitude, longitude }; null for a missing or 0,0 point. */
function toPoint(point) {
  const latitude = Number(point && (point.lat ?? point.latitude));
  const longitude = Number(point && (point.lng ?? point.longitude));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) {
    return null;
  }
  return { latitude, longitude };
}

/**
 * The server's tail in driving order (oldest first). The server may send it newest first: then its first point is
 * the one nearest the vehicle, so it is turned around.
 * @param {Array} tail details.tail from GET /vehicle-details
 * @param {{ latitude: number, longitude: number }|null} current Where the vehicle is now
 */
export function orderTail(tail, current) {
  const points = (tail || []).map(toPoint).filter(Boolean);
  if (points.length < 2 || !current) {
    return points;
  }
  const firstGap = distanceMeters(points[0], current);
  const lastGap = distanceMeters(points[points.length - 1], current);
  return firstGap < lastGap ? points.reverse() : points;
}

/**
 * One clean line: the ordered tail, then the live points, without repeated points. A live point the tail already
 * has (the server's tail was loaded after it arrived) is not added twice, which is what drew the zig-zag.
 * @param {Array} tailPoints From orderTail
 * @param {Array} livePoints Live trail { latitude, longitude } in arrival order
 */
export function buildTailPath(tailPoints, livePoints) {
  const path = [];
  const add = (point) => {
    if (!point) {
      return;
    }
    const last = path[path.length - 1];
    if (last && distanceMeters(last, point) < SAME_POINT_METERS) {
      return;
    }
    path.push(point);
  };
  tailPoints.forEach(add);

  // Live points that are already in the tail are skipped: only the part after the tail's last point is new
  const tailEnd = tailPoints[tailPoints.length - 1];
  let startIndex = 0;
  if (tailEnd) {
    livePoints.forEach((point, index) => {
      if (distanceMeters(point, tailEnd) < SAME_POINT_METERS) {
        startIndex = index + 1;
      }
    });
  }
  livePoints.slice(startIndex).forEach(add);
  return path;
}

/**
 * Make the tail end exactly at the vehicle marker. The marker glides behind the newest live point, so the end of the
 * path (the newest point, and the road points Google adds before it) can be ahead of the marker: those are cut off,
 * and the marker's own spot becomes the last point, so the line always meets the vehicle picture.
 * @param {Array} path The tail to draw (raw or snapped), oldest first
 * @param {{ latitude, longitude }|null} markerSpot Where the marker is drawn now
 * @param {{ latitude, longitude }|null} newestPoint The newest live position (where the marker is heading)
 */
export function attachTailToMarker(path, markerSpot, newestPoint) {
  if (!markerSpot) {
    return path;
  }
  const result = [...path];
  if (newestPoint) {
    const markerToNewest = distanceMeters(markerSpot, newestPoint);
    // A point nearer the newest position than the marker is, is still ahead of the marker: not driven yet
    while (result.length > 0 && distanceMeters(result[result.length - 1], newestPoint) < markerToNewest - SAME_POINT_METERS) {
      result.pop();
    }
  }
  const last = result[result.length - 1];
  if (!last || distanceMeters(last, markerSpot) >= 1) {
    result.push({ latitude: markerSpot.latitude, longitude: markerSpot.longitude });
  }
  return result;
}
