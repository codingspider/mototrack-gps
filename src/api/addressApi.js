// Turn a latitude / longitude into a street address (used for alerts that arrive without one).
import client from './client';
import endpoints from './endpoints';

/**
 * POST /geo_address, body { lat, lon }. The classic GPSWox answer is the address text, possibly wrapped
 * (`{ status: 1, data: 'address' }`). NOT SEEN with a real response yet: `parseAddress` in addressSlice accepts a
 * plain string, `data`, `address` or `items`. Log one real answer and write it here.
 * @param {number} latitude
 * @param {number} longitude
 */
export async function getGeoAddress(latitude, longitude) {
  const response = await client.post(endpoints.geoAddress, { lat: latitude, lon: longitude });
  return response.data;
}
