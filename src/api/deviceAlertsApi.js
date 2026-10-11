// The alert rules attached to one vehicle (overspeed, geofence, ignition... the ones set up on the web portal).
import client from './client';
import endpoints from './endpoints';

/**
 * GET /devices/{id}/alerts?page= (Frontend\DeviceAlertsController@index, 15 per page, Fractal format):
 * { data: [{ id, name, active: true, date_from: null | '2026-10-01 00:00:00', date_to: null | '...' }],
 *   meta: { pagination: { total, per_page, current_page, last_page, next_page_url, prev_page_url } } }
 * Only the alerts of the logged-in customer that watch this vehicle. 403 when the user may not view alerts.
 * NOT SEEN with a real response yet: read from the controller and transformer.
 * @param {number} deviceId
 * @param {number} page
 */
export async function getDeviceAlerts(deviceId, page = 1) {
  const response = await client.get(endpoints.deviceAlerts(deviceId), { params: { page } });
  return response.data;
}

/**
 * Switch an alert on or off (POST /change_active_alert, body { id, active }, AlertsController@changeActive).
 * Answer: { status: 1 }. The alert is switched for every vehicle it covers, not only this one. The server only changes
 * alerts the user may switch (`can active`), and still answers status 1 when it skipped one, so read the list back.
 * @param {number} alertId
 * @param {boolean} isActive
 */
export async function setAlertActive(alertId, isActive) {
  const response = await client.post(endpoints.changeActiveAlert, { id: alertId, active: isActive ? 1 : 0 });
  return response.data;
}
