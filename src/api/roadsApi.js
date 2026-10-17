// Google Roads API: moves GPS points onto the nearest roads and adds the points in between (interpolate), so the
// vehicle tail follows the road instead of cutting straight across houses. This is Google, not our server, so it
// uses plain fetch and never the shared axios client (that one adds the customer's user_api_hash).
// The Maps key must have "Roads API" enabled in Google Cloud. It is billed per request (one request = up to 100 points).
import { MAPS_API_KEY } from '../config/env';

const SNAP_URL = 'https://roads.googleapis.com/v1/snapToRoads';
const MAX_POINTS = 100; // Google's limit per request
const TIMEOUT_MS = 10000;

/**
 * Snap a path to the roads.
 * Response: { snappedPoints: [{ location: { latitude, longitude }, originalIndex?, placeId }] }
 * @param {{ latitude: number, longitude: number }[]} points In driving order, at most 100 (the newest are kept)
 * @returns {Promise<{ latitude: number, longitude: number }[]>} The road-following path
 */
export async function snapToRoads(points) {
  if (!MAPS_API_KEY) {
    throw new Error('No Google Maps key');
  }
  const path = points
    .slice(-MAX_POINTS)
    .map((point) => `${point.latitude.toFixed(6)},${point.longitude.toFixed(6)}`)
    .join('|');
  const url = `${SNAP_URL}?interpolate=true&path=${encodeURIComponent(path)}&key=${MAPS_API_KEY}`;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    const data = await response.json();
    if (!response.ok || data.error) {
      throw new Error((data.error && data.error.message) || 'Roads API error');
    }
    return (data.snappedPoints || []).map((item) => ({
      latitude: item.location.latitude,
      longitude: item.location.longitude,
    }));
  } finally {
    clearTimeout(timer);
  }
}
