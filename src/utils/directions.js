// Routes between two places (Route finder and Route analytics): reading Google's Directions answer and writing
// distance, time and traffic in plain words. Pure functions, covered by tests.
import { formatBdTime } from './formatDate';

/* eslint-disable no-bitwise -- the encoded polyline format is built from bit operations */
/**
 * Google's encoded line -> map points. (The standard "encoded polyline" format, 5 decimals.)
 * @param {string} encoded
 * @returns {Array<{ latitude: number, longitude: number }>}
 */
export function decodePolyline(encoded) {
  const points = [];
  let index = 0;
  let latitude = 0;
  let longitude = 0;
  const readNumber = () => {
    let result = 0;
    let shift = 0;
    let byte;
    do {
      byte = encoded.charCodeAt(index) - 63;
      index += 1;
      result |= (byte & 0x1f) << shift;
      shift += 5;
    } while (byte >= 0x20 && index < encoded.length + 1);
    return result & 1 ? ~(result >> 1) : result >> 1;
  };
  while (index < encoded.length) {
    latitude += readNumber();
    longitude += readNumber();
    points.push({ latitude: latitude / 1e5, longitude: longitude / 1e5 });
  }
  return points;
}

/* eslint-enable no-bitwise */

/** "Turn <b>left</b> onto <b>N5</b><div>...</div>" -> "Turn left onto N5" */
export function stripHtml(text) {
  return String(text || '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/** 850 -> "850 m", 12345 -> "12.3 km", 185015 -> "185 km". */
export function formatDistance(meters) {
  const value = Number(meters) || 0;
  if (value < 1000) {
    return `${Math.round(value)} m`;
  }
  const km = value / 1000;
  return `${km >= 100 ? Math.round(km) : km.toFixed(1)} km`;
}

/** 14834 -> "4 h 7 min", 2700 -> "45 min", 20 -> "1 min". */
export function formatDuration(seconds) {
  const totalMinutes = Math.max(1, Math.round((Number(seconds) || 0) / 60));
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  if (hours === 0) {
    return `${minutes} min`;
  }
  return minutes === 0 ? `${hours} h` : `${hours} h ${minutes} min`;
}

/**
 * How busy the road is: the extra time compared with an empty road.
 * @param {number} normalSeconds Time with no traffic
 * @param {number|null} trafficSeconds Time with today's traffic (null when Google did not say)
 * @returns {{ level: 'unknown'|'light'|'moderate'|'heavy', delaySeconds: number, text: string }}
 */
export function getTrafficInfo(normalSeconds, trafficSeconds) {
  if (!trafficSeconds || !normalSeconds) {
    return { level: 'unknown', delaySeconds: 0, text: 'Traffic not available' };
  }
  const delaySeconds = Math.max(0, trafficSeconds - normalSeconds);
  const ratio = delaySeconds / normalSeconds;
  if (ratio < 0.1) {
    return { level: 'light', delaySeconds, text: 'Light traffic' };
  }
  if (ratio < 0.3) {
    return { level: 'moderate', delaySeconds, text: `Moderate traffic, +${formatDuration(delaySeconds)}` };
  }
  return { level: 'heavy', delaySeconds, text: `Heavy traffic, +${formatDuration(delaySeconds)}` };
}

/** "Arrive 02:15 PM" for a trip that takes this long from now (Bangladesh time). */
export function formatArrival(seconds, nowMs = Date.now()) {
  return formatBdTime(Math.floor(nowMs / 1000) + Math.round(seconds));
}

/**
 * Directions API answer -> a list of routes the screens can draw.
 * Answer: { status: 'OK', routes: [{ summary: 'N5', overview_polyline: { points }, legs: [{ distance: { value },
 *   duration: { value }, duration_in_traffic: { value }, start_address, end_address, start_location: { lat, lng },
 *   end_location: { lat, lng }, steps: [{ html_instructions, distance: { text }, duration: { text } }] }] }] }
 * `duration_in_traffic` is only there when the request had departure_time.
 * @returns {Array<object>} Empty when there is no route
 */
export function parseDirections(data) {
  if (!data || data.status !== 'OK') {
    return [];
  }
  return (data.routes || []).map((route, index) => {
    const legs = route.legs || [];
    const sum = (read) => legs.reduce((total, leg) => total + (read(leg) || 0), 0);
    const normalSeconds = sum((leg) => leg.duration && leg.duration.value);
    const hasTraffic = legs.length > 0 && legs.every((leg) => leg.duration_in_traffic && leg.duration_in_traffic.value);
    const trafficSeconds = hasTraffic ? sum((leg) => leg.duration_in_traffic.value) : null;
    const first = legs[0] || {};
    const last = legs[legs.length - 1] || {};
    return {
      id: index,
      summary: route.summary || '',
      distanceMeters: sum((leg) => leg.distance && leg.distance.value),
      normalSeconds,
      trafficSeconds,
      durationSeconds: trafficSeconds || normalSeconds,
      traffic: getTrafficInfo(normalSeconds, trafficSeconds),
      startAddress: first.start_address || '',
      endAddress: last.end_address || '',
      start: first.start_location ? { latitude: first.start_location.lat, longitude: first.start_location.lng } : null,
      end: last.end_location ? { latitude: last.end_location.lat, longitude: last.end_location.lng } : null,
      points: route.overview_polyline ? decodePolyline(route.overview_polyline.points) : [],
      steps: legs.flatMap((leg) =>
        (leg.steps || []).map((step) => ({
          text: stripHtml(step.html_instructions),
          distanceText: step.distance ? step.distance.text : '',
          durationText: step.duration ? step.duration.text : '',
        })),
      ),
    };
  });
}

const EARTH_RADIUS_METERS = 6371000;

/** Straight-line distance between two places in meters (great circle, the "as the crow flies" number). */
export function straightLineMeters(from, to) {
  const toRadians = (degrees) => (degrees * Math.PI) / 180;
  const dLat = toRadians(to.latitude - from.latitude);
  const dLng = toRadians(to.longitude - from.longitude);
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRadians(from.latitude)) * Math.cos(toRadians(to.latitude)) * Math.sin(dLng / 2) ** 2;
  return 2 * EARTH_RADIUS_METERS * Math.asin(Math.sqrt(a));
}

/**
 * Directions API wants places as "lat,lng" or "place_id:XYZ".
 * @param {{ latitude: number, longitude: number, placeId?: string }} place
 */
export function toDirectionsPlace(place) {
  if (place.placeId) {
    return `place_id:${place.placeId}`;
  }
  return `${place.latitude},${place.longitude}`;
}

/** The link that opens the same trip in the Google Maps app. */
export function buildGoogleMapsUrl(origin, destination) {
  const encode = (place) => encodeURIComponent(place.placeId ? place.label || `${place.latitude},${place.longitude}` : `${place.latitude},${place.longitude}`);
  const destinationPlaceId = destination.placeId ? `&destination_place_id=${destination.placeId}` : '';
  return `https://www.google.com/maps/dir/?api=1&origin=${encode(origin)}&destination=${encode(destination)}${destinationPlaceId}&travelmode=driving`;
}
