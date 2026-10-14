// The warranty countdown of every device of the customer.
import client from './client';
import endpoints from './endpoints';

/**
 * Warranty of all the customer's devices (GET /warranty-check without parameters, V1\WarrantyController@index).
 * Same fields as the single-device answer in vehiclesApi.getWarranty, one entry per device:
 * {
 *   status: 1,
 *   items: [{
 *     device_id, name, imei, plate_number,
 *     warranty_start: '2026-09-22', warranty_end: '2026-10-31', warranty_period: '1 year',
 *     status: 'active' | 'expired', expired: false,
 *     countdown: { days, hours, minutes, seconds, total_seconds, text: '24 days 6 hours 32 minutes left' },
 *     server_time: '2026-10-07 17:27:56'
 *   }]
 * }
 * Written from the controller: NOT SEEN with a real list answer yet.
 */
export async function getAllWarranties() {
  const response = await client.get(endpoints.warrantyCheck);
  return response.data;
}
