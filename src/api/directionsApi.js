// Google Directions and Places (route and place search). This is Google, not our server, so it uses plain fetch
// and never the shared axios client (that one adds the customer's user_api_hash to every request).
// The Maps key must have "Directions API" and "Places API" enabled in Google Cloud.
import { MAPS_API_KEY } from '../config/env';

const BASE_URL = 'https://maps.googleapis.com/maps/api';
const TIMEOUT_MS = 15000;

/** fetch with a timeout and a friendly error. */
async function getJson(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return await response.json();
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('Google Maps took too long to answer, please try again');
    }
    throw new Error('No internet connection');
  } finally {
    clearTimeout(timer);
  }
}

/** Turn a Google status that is not OK into a message for the customer. */
function explainStatus(status, errorMessage) {
  if (status === 'ZERO_RESULTS' || status === 'NOT_FOUND') {
    return 'No route was found between these places';
  }
  if (status === 'REQUEST_DENIED') {
    return errorMessage ? `Google Maps refused the request: ${errorMessage}` : 'Google Maps refused the request';
  }
  if (status === 'OVER_QUERY_LIMIT') {
    return 'Too many requests to Google Maps, please try again in a moment';
  }
  return 'Could not get the route, please try again';
}

/**
 * GET /directions/json with departure_time=now (so the answer has the time in today's traffic) and alternatives.
 * @param {string} origin "lat,lng" or "place_id:XYZ"
 * @param {string} destination "lat,lng" or "place_id:XYZ"
 * @returns {Promise<object>} The raw answer (see utils/directions.js parseDirections)
 */
export async function getDirections(origin, destination) {
  if (!MAPS_API_KEY) {
    throw new Error('The Google Maps key is missing in this build');
  }
  const query = [
    `origin=${encodeURIComponent(origin)}`,
    `destination=${encodeURIComponent(destination)}`,
    'mode=driving',
    'alternatives=true',
    'departure_time=now',
    'language=en',
    `key=${MAPS_API_KEY}`,
  ].join('&');
  const data = await getJson(`${BASE_URL}/directions/json?${query}`);
  if (data.status !== 'OK') {
    throw new Error(explainStatus(data.status, data.error_message));
  }
  return data;
}

/**
 * GET /place/autocomplete/json: places that match what the customer typed.
 * Answer: { status: 'OK', predictions: [{ description: 'Dhaka, Bangladesh', place_id: 'ChIJ...',
 *   structured_formatting: { main_text: 'Dhaka', secondary_text: 'Bangladesh' } }] }
 * @param {string} text
 * @param {{ latitude: number, longitude: number }|null} near Results close to here come first
 * @returns {Promise<Array<{ placeId: string, title: string, subtitle: string }>>}
 */
export async function searchPlaces(text, near) {
  if (!MAPS_API_KEY) {
    throw new Error('The Google Maps key is missing in this build');
  }
  const query = [`input=${encodeURIComponent(text)}`, 'language=en', `key=${MAPS_API_KEY}`];
  if (near) {
    query.push(`location=${near.latitude},${near.longitude}`, 'radius=200000');
  }
  const data = await getJson(`${BASE_URL}/place/autocomplete/json?${query.join('&')}`);
  if (data.status === 'ZERO_RESULTS') {
    return [];
  }
  if (data.status !== 'OK') {
    throw new Error(explainStatus(data.status, data.error_message));
  }
  return (data.predictions || []).map((item) => ({
    placeId: item.place_id,
    title: item.structured_formatting ? item.structured_formatting.main_text : item.description,
    subtitle: item.structured_formatting ? item.structured_formatting.secondary_text || '' : '',
  }));
}
