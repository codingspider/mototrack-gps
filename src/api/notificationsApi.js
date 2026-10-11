// The customer's alerts (events) from the vehicles they own.
import client from './client';
import endpoints from './endpoints';

/**
 * Get one page of alerts, newest first (GET /notifications, V1\NotificationsController@index).
 * Optional params: device_id, type, date_from, date_to, search, page, per_page (max 100).
 * {
 *   status: 1,
 *   pagination: { total, per_page, current_page, last_page },
 *   items: [{ id, type: 'overspeed', title, message, detail, alert_id, alert: 'name' | null,
 *             device: { id, name, imei } | null, geofence: { id, name } | null,
 *             latitude, longitude, speed, address, time: '2026-10-08 12:22:46', created_at }]
 * }
 * The app never shows the device `imei`.
 * @param {{ page?: number, perPage?: number }} options
 */
export async function getNotifications({ page = 1, perPage = 20 } = {}) {
  const response = await client.get(endpoints.notifications, { params: { page, per_page: perPage } });
  return response.data;
}
