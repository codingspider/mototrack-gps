// The customer's alarm rules (overspeed, geofence, ignition...) and switching them on or off.
import client from './client';
import endpoints from './endpoints';

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

/**
 * Every alarm rule of the logged-in customer, for all vehicles (GET /get_alerts, classic GPSWox AlertsController@index).
 * Expected: { status: 1, items: { alerts: [{ id, name, active: 1 | 0, devices: [ids], ... }] } }
 * NOT SEEN with a real response yet: read from the classic API docs. `parseAlerts` in alarmSettingsSlice also accepts
 * `items` as a plain array. Log one real answer and write it here.
 */
export async function getAllAlerts() {
  const response = await client.get(endpoints.alerts);
  return response.data;
}
