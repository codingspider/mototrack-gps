// The overspeed limit of one vehicle (the customer gets an alert when it goes faster).
import client from './client';
import endpoints from './endpoints';

/**
 * Read the limit (GET /devices/{id}/overspeed). Real response when the vehicle has no limit of its own:
 * {
 *   status: 1,
 *   device: { id: 8, name: 'Bogura NA 11-1516' },
 *   unit: 'kph',
 *   overspeed: null,                                   // the vehicle's own limit; null = none set
 *   other_overspeed_alerts: [{ alert_id: 137, name: 'Overspeed 80 km/h', limit: 80, active: true }]
 * }
 * NOT SEEN YET: the shape of `overspeed` once a limit is set. The app reads `overspeed.limit` (the same word the
 * alerts use) and shows "no limit" if it is not there.
 */
export async function getOverspeedLimit(deviceId) {
  const response = await client.get(endpoints.deviceOverspeed(deviceId));
  return response.data;
}

/** Set the limit (POST /devices/{id}/overspeed with `limit`, as in the Postman collection). The app then reads it back. */
export async function setOverspeedLimit(deviceId, limit) {
  const response = await client.post(endpoints.deviceOverspeed(deviceId), { limit });
  return response.data;
}

/** Remove the limit (DELETE /devices/{id}/overspeed). The app then reads it back. */
export async function removeOverspeedLimit(deviceId) {
  const response = await client.delete(endpoints.deviceOverspeed(deviceId));
  return response.data;
}
