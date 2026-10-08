// Playback (route history) of one vehicle.
import client from './client';
import endpoints from './endpoints';

/**
 * Get the recorded route of a vehicle for a date and time range (GET /get_playback).
 * Params: device_id, from_date / to_date 'YYYY-MM-DD', from_time / to_time 'HH:mm' (Bangladesh time),
 * limit (max points, we ask for 5000), skip_invalid=1 (drop bad GPS fixes).
 * Real response:
 * {
 *   status: 1,
 *   device: { id: 2, name: 'DM GA 32-4468', imei: '...' },   // imei is never shown in the app
 *   range: { from: '2026-10-08 00:00:00', to: '2026-10-08 23:59:00' },
 *   count: 296, total: 296, truncated: false, limit: 5000,   // truncated = more points exist than `limit`
 *   duration: 13953,                                          // seconds between first and last point
 *   bounds: { min_lat, max_lat, min_lng, max_lng },           // box that fits the whole route
 *   speed_factor: 47.3,
 *   points: [{
 *     id, time: '2026-10-08 01:54:47' (Bangladesh time), raw_time, timestamp: 1791402887 (true unix seconds),
 *     lat, lng, speed (km/h), altitude, course (degrees), ignition: true, valid: true
 *   }]
 * }
 * @param {object} params { deviceId, fromDate, toDate, fromTime, toTime }
 */
export async function getPlayback({ deviceId, fromDate, toDate, fromTime, toTime }) {
  const response = await client.get(endpoints.playback, {
    params: {
      device_id: deviceId,
      from_date: fromDate,
      to_date: toDate,
      from_time: fromTime,
      to_time: toTime,
      limit: 5000,
      skip_invalid: 1,
    },
  });
  return response.data;
}
