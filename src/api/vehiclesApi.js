// Vehicle list call.
import client from './client';
import endpoints from './endpoints';

/**
 * Get the customer's vehicles (V1\VehiclesController@index). One request, up to 500 vehicles.
 * Response:
 * {
 *   status: 1,
 *   summary: { total, online, offline, suspended },
 *   pagination: { total, per_page, current_page, last_page },
 *   items: [{
 *     id, device_name, plate_number, device_type,
 *     status: 'Moving' | 'Idling' | 'Engine Off' | 'Offline' | 'Suspended',
 *     engine_status, engine_blocked, live_speed, driver_name,
 *     lat, lng, address, last_position_time, last_position_stamp, geofences: []
 *   }]
 * }
 */
export async function getVehicles() {
  const response = await client.get(endpoints.vehicles, {
    params: { per_page: 500 },
  });
  return response.data;
}