// Geofence calls.
import client from './client';
import endpoints from './endpoints';

/**
 * Create a polygon geofence (POST /add_geofence).
 * Request body (from the Postman collection "Set Geofence data"):
 * { name, type: 'polygon', polygon_color: '#d000df', polygon: [{ lat, lng }, ...] }
 * The response shape has not been logged yet. Once one is, paste it here.
 * @param {object} payload See utils/geofence.js buildGeofencePayload
 */
export async function addGeofence(payload) {
  const response = await client.post(endpoints.addGeofence, payload);
  return response.data;
}
