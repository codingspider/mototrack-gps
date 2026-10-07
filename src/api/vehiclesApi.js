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

/**
 * Get the full details of one vehicle (GET /vehicle-details?vehicle_id=).
 * Real response:
 * {
 *   status: 1,
 *   item: {
 *     id, device_name, plate_number, device_type, status: 'ack' (raw device state, not the list label),
 *     engine_status, engine_blocked, engine_hours, detect_engine,
 *     live_speed: '0.00', speed, speed_unit: 'kph', course, altitude, lat: '25.09', lng: '89.43', address,
 *     last_position_time: '2026-10-07 11:18:08' (Bangladesh time), last_position_stamp (unix seconds),
 *     tail: [{ lat, lng }, ...] (last few points), today_travel, today_travel_unit: 'Km', total_distance,
 *     driver_name, driver, imei, vin, registration_number, device_model, sim_number, object_owner,
 *     comment, additional_notes, expiration_date, group_id, icon_type, icon_color,
 *     sensors: [{ id, type, name, show_in_popup, value: 'Off', val, scale_value }],
 *     services: [], geofences: []
 *   }
 * }
 * @param {number} vehicleId
 */
export async function getVehicleDetails(vehicleId) {
  const response = await client.get(endpoints.vehicleDetails, {
    params: { vehicle_id: vehicleId },
  });
  return response.data;
}

/**
 * Warranty of one vehicle's device (GET /warranty-check?device_id=).
 * Real response:
 * {
 *   status: 1,
 *   item: {
 *     device_id, name, imei, plate_number,
 *     warranty_start: '2026-09-22', warranty_end: '2026-10-31', warranty_period: '1 year',
 *     status: 'active', expired: false,
 *     countdown: { days, hours, minutes, seconds, total_seconds, text: '24 days 6 hours 32 minutes left' },
 *     server_time: '2026-10-07 17:27:56'
 *   }
 * }
 * @param {number} vehicleId
 */
export async function getWarranty(vehicleId) {
  const response = await client.get(endpoints.warrantyCheck, {
    params: { device_id: vehicleId },
  });
  return response.data;
}