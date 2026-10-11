// Geofence calls: the customer's zones, and linking a zone to one vehicle (the enter / leave alert).
import client from './client';
import endpoints from './endpoints';

/**
 * All geofences of the customer (GET /get_geofences, V1\GeofencesController@index).
 * { items: { geofences: [{ id, user_id, group_id, device_id, name, active, polygon_color, speed_limit,
 *     type: 'polygon' | 'circle',
 *     coordinates: '[{"lat":24.9,"lng":89.2}, ...]'   (JSON text, polygons),
 *     center: { lat, lng }, radius: 150.0 (meters, circles) }] } }
 * NOT SEEN YET with real data: the app also accepts `items` as a plain list and `coordinates` as a list.
 */
export async function getGeofences() {
  const response = await client.get(endpoints.geofences);
  return response.data;
}

/**
 * Create a polygon geofence (POST /add_geofence). Answer: { status: 1, item: { id, name, ... } }.
 * Request body (from the Postman collection "Set Geofence data"):
 * { name, type: 'polygon', polygon_color: '#d000df', polygon: [{ lat, lng }, ...] }
 * @param {object} payload See utils/geofence.js buildGeofencePayload
 */
export async function addGeofence(payload) {
  const response = await client.post(endpoints.addGeofence, payload);
  return response.data;
}

/**
 * Change a geofence (POST /edit_geofence). Body: { id, name?, polygon_color?, type?, polygon? }. Answer: { status: 1 }.
 * @param {object} payload See utils/geofence.js buildEditPayload
 */
export async function editGeofence(payload) {
  const response = await client.post(endpoints.editGeofence, payload);
  return response.data;
}

/** Delete a geofence for good (POST /destroy_geofence, body { id }). Answer: { status: 1 }. */
export async function destroyGeofence(id) {
  const response = await client.post(endpoints.destroyGeofence, { id });
  return response.data;
}

/**
 * The geofences linked to one vehicle (GET /vehicle-geofences?device_id=5, V1\VehicleGeofencesController@index).
 * { status: 1, device_id: 5, items: [{ alert_id, zone: 'in'|'out'|'both', active: true, geofence_id,
 *   geofence_name, type: 'polygon', polygon_color }] }
 * The list has no shape: the shape comes from getGeofences().
 */
export async function getVehicleGeofences(deviceId) {
  const response = await client.get(endpoints.vehicleGeofences, { params: { device_id: deviceId } });
  return response.data;
}

/**
 * Link a geofence to a vehicle, or change its zone (POST /vehicle-geofences, body { device_id, geofence_id, zone }).
 * Answer: { status: 1, created: true, item: { alert_id, zone, active, geofence_id, ... } }
 */
export async function linkVehicleGeofence({ deviceId, geofenceId, zone }) {
  const response = await client.post(endpoints.vehicleGeofences, {
    device_id: deviceId,
    geofence_id: geofenceId,
    zone,
  });
  return response.data;
}

/** Unlink a geofence from a vehicle (DELETE /vehicle-geofences). Answer: { status: 1, deleted: 1 } or 404. */
export async function unlinkVehicleGeofence({ deviceId, geofenceId }) {
  const response = await client.delete(endpoints.vehicleGeofences, {
    data: { device_id: deviceId, geofence_id: geofenceId },
  });
  return response.data;
}
