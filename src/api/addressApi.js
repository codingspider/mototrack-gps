// Turn a latitude / longitude into a street address (alerts, the vehicle details page, playback pins).
// Our server is asked first; when it has no address for the place, Google Geocoding is asked instead.
import { MAPS_API_KEY } from '../config/env';
import client from './client';
import endpoints from './endpoints';

const GOOGLE_GEOCODE_URL = 'https://maps.googleapis.com/maps/api/geocode/json';
const GOOGLE_TIMEOUT_MS = 10000;

/**
 * POST /geo_address, body { lat, lon }. The classic GPSWox answer is the address text, possibly wrapped
 * (`{ status: 1, data: 'address' }`), or "-" when the server's geocoder has nothing. `parseAddress` in addressSlice
 * accepts a plain string, `data`, `address` or `items`.
 * @param {number} latitude
 * @param {number} longitude
 */
export async function getGeoAddress(latitude, longitude) {
  const response = await client.post(endpoints.geoAddress, { lat: latitude, lon: longitude });
  return response.data;
}

/**
 * Pick the address text from a Google Geocoding answer: the first result that is a real place, not a plus code
 * ("8Q7X+2F Bogura" says nothing to a customer).
 * Answer: { status: 'OK' | 'ZERO_RESULTS' | 'REQUEST_DENIED' ..., results: [{ formatted_address, types: [] }] }
 * @returns {string} '' when there is none
 */
export function pickGoogleAddress(data) {
  if (!data || data.status !== 'OK' || !Array.isArray(data.results)) {
    return '';
  }
  const place = data.results.find((item) => item && item.formatted_address && !(item.types || []).includes('plus_code'));
  return place ? place.formatted_address.trim() : '';
}

/**
 * Google Geocoding (reverse). This is Google, not our server, so it uses plain fetch and never the shared axios
 * client (that one adds the customer's user_api_hash). The Maps key must have "Geocoding API" enabled in Google Cloud.
 * @returns {Promise<string>} The address, '' when Google has none
 */
export async function getGoogleAddress(latitude, longitude) {
  if (!MAPS_API_KEY) {
    return '';
  }
  const url = `${GOOGLE_GEOCODE_URL}?latlng=${Number(latitude).toFixed(6)},${Number(longitude).toFixed(6)}&key=${MAPS_API_KEY}`;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), GOOGLE_TIMEOUT_MS);
  try {
    const response = await fetch(url, { signal: controller.signal });
    return pickGoogleAddress(await response.json());
  } finally {
    clearTimeout(timer);
  }
}
