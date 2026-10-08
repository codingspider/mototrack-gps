// Turns the raw playback points into the numbers and events the Playback page shows. Pure functions, no UI.
// A point looks like { timestamp (unix s), lat, lng, speed (km/h), course, ignition }.
import { bearingDegrees, distanceMeters } from './heading';

export const MIN_STOP_SECONDS = 180; // a pause shorter than this is a traffic light, not a parking stop
const MAX_GAP_SECONDS = 300; // a longer silence is "no data", not driving time
const MOVING_SPEED_KMH = 1; // at or below this the vehicle counts as standing still

const toPoint = (item) => ({ latitude: Number(item.lat), longitude: Number(item.lng) });
const isStill = (item) => Number(item.speed) <= MOVING_SPEED_KMH;

/**
 * Standing-still periods of at least MIN_STOP_SECONDS.
 * @returns {Array<{ startIndex, endIndex, startTime, endTime, seconds, latitude, longitude }>}
 */
export function findStops(points) {
  const stops = [];
  let runStart = null;

  const closeRun = (runEnd) => {
    if (runStart === null) {
      return;
    }
    const first = points[runStart];
    const last = points[runEnd];
    const seconds = last.timestamp - first.timestamp;
    if (seconds >= MIN_STOP_SECONDS) {
      stops.push({
        startIndex: runStart,
        endIndex: runEnd,
        startTime: first.timestamp,
        endTime: last.timestamp,
        seconds,
        latitude: Number(first.lat),
        longitude: Number(first.lng),
      });
    }
    runStart = null;
  };

  points.forEach((item, index) => {
    if (isStill(item)) {
      if (runStart === null) {
        runStart = index;
      }
      return;
    }
    // The first moving point after a pause: the pause lasted until then
    closeRun(index);
  });
  closeRun(points.length - 1);
  return stops;
}

/** Km driven up to each point (index 0 is 0). Used for "45.0 km travelled" on the timeline. */
export function cumulativeKm(points) {
  const totals = [0];
  for (let index = 1; index < points.length; index += 1) {
    const meters = distanceMeters(toPoint(points[index - 1]), toPoint(points[index]));
    totals.push(totals[index - 1] + meters / 1000);
  }
  return totals;
}

/**
 * Summary of a trip.
 * @returns {{ distanceKm, drivingSeconds, parkingSeconds, avgSpeedKmh, maxSpeedKmh, stops, startTime, endTime }}
 */
export function summarizeTrip(points) {
  if (points.length === 0) {
    return { distanceKm: 0, drivingSeconds: 0, parkingSeconds: 0, avgSpeedKmh: 0, maxSpeedKmh: 0, stops: [], startTime: null, endTime: null };
  }
  const stops = findStops(points);
  const distanceKm = cumulativeKm(points)[points.length - 1];
  const parkingSeconds = stops.reduce((total, stop) => total + stop.seconds, 0);

  let drivingSeconds = 0;
  let maxSpeedKmh = 0;
  for (let index = 0; index < points.length - 1; index += 1) {
    const gap = points[index + 1].timestamp - points[index].timestamp;
    if (!isStill(points[index]) && gap <= MAX_GAP_SECONDS) {
      drivingSeconds += gap;
    }
    maxSpeedKmh = Math.max(maxSpeedKmh, Number(points[index].speed) || 0);
  }
  const avgSpeedKmh = drivingSeconds > 0 ? distanceKm / (drivingSeconds / 3600) : 0;

  return {
    distanceKm,
    drivingSeconds,
    parkingSeconds,
    avgSpeedKmh,
    maxSpeedKmh,
    stops,
    startTime: points[0].timestamp,
    endTime: points[points.length - 1].timestamp,
  };
}

/**
 * Where the vehicle is at a moment of the trip, between the two recorded points around it.
 * @param {Array} points Playback points, oldest first
 * @param {number} time Unix seconds
 * @returns {{ latitude, longitude, heading, speed, index }} index = last point at or before `time`
 */
export function positionAt(points, time) {
  if (points.length === 0) {
    return null;
  }
  const last = points.length - 1;
  if (time <= points[0].timestamp) {
    return { ...toPoint(points[0]), heading: Number(points[0].course) || 0, speed: Number(points[0].speed) || 0, index: 0 };
  }
  if (time >= points[last].timestamp) {
    return { ...toPoint(points[last]), heading: Number(points[last].course) || 0, speed: Number(points[last].speed) || 0, index: last };
  }
  // Binary search for the point just before `time`
  let low = 0;
  let high = last;
  while (high - low > 1) {
    const middle = Math.floor((low + high) / 2);
    if (points[middle].timestamp <= time) {
      low = middle;
    } else {
      high = middle;
    }
  }
  const from = points[low];
  const to = points[high];
  const share = (time - from.timestamp) / (to.timestamp - from.timestamp);
  const fromPoint = toPoint(from);
  const toPointValue = toPoint(to);
  const moved = distanceMeters(fromPoint, toPointValue) > 3;
  return {
    latitude: fromPoint.latitude + (toPointValue.latitude - fromPoint.latitude) * share,
    longitude: fromPoint.longitude + (toPointValue.longitude - fromPoint.longitude) * share,
    // Face the way the segment goes; for a tiny move keep the recorded heading
    heading: moved ? bearingDegrees(fromPoint, toPointValue) : Number(from.course) || 0,
    speed: Number(from.speed) || 0,
    index: low,
  };
}

/**
 * Timeline entries: trip started, each stop (parked + resumed), trip ended.
 * @returns {Array<{ key, type: 'start'|'park'|'resume'|'end', time, title, detail }>}
 */
export function buildTimeline(points, stops) {
  if (points.length === 0) {
    return [];
  }
  const km = cumulativeKm(points);
  const formatKm = (value) => `${value.toFixed(1)} km`;
  const items = [{ key: 'start', type: 'start', time: points[0].timestamp, title: 'Trip started', detail: '' }];

  stops.forEach((stop, number) => {
    const minutes = Math.round(stop.seconds / 60);
    items.push({
      key: `park-${number}`,
      type: 'park',
      time: stop.startTime,
      title: 'Parked',
      detail: `${formatKm(km[stop.startIndex])} travelled · ${minutes}m parked`,
    });
    // A stop that runs to the end of the trip has no "resumed"
    if (stop.endIndex < points.length - 1) {
      items.push({ key: `resume-${number}`, type: 'resume', time: stop.endTime, title: 'Journey resumed', detail: '' });
    }
  });

  items.push({
    key: 'end',
    type: 'end',
    time: points[points.length - 1].timestamp,
    title: 'Trip ended',
    detail: `${formatKm(km[km.length - 1])} travelled`,
  });
  return items;
}

/** "2h 43m" / "17m" / "45s" */
export function formatDuration(seconds) {
  const total = Math.max(0, Math.round(seconds));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  }
  if (minutes > 0) {
    return `${minutes}m`;
  }
  return `${total}s`;
}
