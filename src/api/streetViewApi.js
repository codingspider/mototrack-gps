// Google Street View lookup. This is Google, not our server, so it uses plain fetch and
// never the shared axios client (that one adds the customer's user_api_hash to every request).
import { MAPS_API_KEY } from '../config/env';
import { getStreetViewMetadataUrl } from '../utils/streetView';

/**
 * Find the nearest street panorama around a spot.
 * Response: { status: 'OK', pano_id: 'CAoS...', location: { lat, lng }, date: '2024-05' }
 * or { status: 'ZERO_RESULTS' } when there is no Street View within the search radius.
 * @param {number} latitude
 * @param {number} longitude
 */
export async function findStreetViewPanorama(latitude, longitude) {
  const response = await fetch(getStreetViewMetadataUrl(latitude, longitude, MAPS_API_KEY));
  return response.json();
}
