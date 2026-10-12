// The live share link of one vehicle: a public page with the live position that stops working after some hours.
import client from './client';
import endpoints from './endpoints';

/**
 * Read the live link (GET /devices/{id}/share), backend DeviceShareController@show:
 * { status: 1, shared: true, url: 'https://mototrack24.com/sharing/<hash>', expires_at: 1790493116 }  // unix seconds, UTC
 * or { status: 1, shared: false } when there is no live link.
 * NOT SEEN with a real response yet: written from the controller. Log one real answer and paste it here.
 * @param {number} deviceId
 */
export async function getShare(deviceId) {
  const response = await client.get(endpoints.deviceShare(deviceId));
  return response.data;
}

/**
 * Make a link that works for `hours` (POST /devices/{id}/share, body { hours: 1..12 }). Same answer as getShare.
 * Replaces the vehicle's earlier link.
 * @param {number} deviceId
 * @param {number} hours
 */
export async function createShare(deviceId, hours) {
  const response = await client.post(endpoints.deviceShare(deviceId), { hours });
  return response.data;
}

/** Stop sharing now (DELETE /devices/{id}/share). Answer: { status: 1 }. */
export async function removeShare(deviceId) {
  const response = await client.delete(endpoints.deviceShare(deviceId));
  return response.data;
}
