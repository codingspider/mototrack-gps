// Which vehicles count as "recent activity" on Home: they did something in the last few hours. Pure function.
// A vehicle counts when EITHER its location changed in the window (even if it is stopped or offline now), OR it
// reported in the window and is moving, idling or has its engine on. The second part keeps the list useful when the
// server does not know when a vehicle last moved (an older server, or a tracker that never sets it).
import { STATUS_IDLING, STATUS_MOVING, STATUS_SUSPENDED } from './vehicleStatus';

export const RECENT_ACTIVITY_HOURS = 3;

/** True when the vehicle is moving, idling or has its engine on. */
function isActiveNow(vehicle) {
  const isEngineOn = vehicle.engine_status === true || vehicle.engine_status === 1 || vehicle.engine_status === '1';
  return vehicle.status === STATUS_MOVING || vehicle.status === STATUS_IDLING || isEngineOn;
}

/**
 * `last_moved_stamp` is unix seconds of the last time the location changed (the server sends it, and the live socket
 * keeps it up to date); null or missing means unknown.
 * @param {Array<object>} vehicles Vehicles from Redux
 * @param {number} nowMs Current time in milliseconds
 * @returns {Array<object>} The recent ones, the one with the latest activity first
 */
export function getRecentActivityVehicles(vehicles, nowMs = Date.now()) {
  const sinceSeconds = nowMs / 1000 - RECENT_ACTIVITY_HOURS * 3600;

  const movedAt = (vehicle) => Number(vehicle.last_moved_stamp) || 0;
  const reportedAt = (vehicle) => Number(vehicle.last_position_stamp) || 0;

  return vehicles
    .filter((vehicle) => {
      if (vehicle.status === STATUS_SUSPENDED) {
        return false;
      }
      const movedRecently = movedAt(vehicle) >= sinceSeconds;
      const activeRecently = reportedAt(vehicle) >= sinceSeconds && isActiveNow(vehicle);
      return movedRecently || activeRecently;
    })
    .sort((a, b) => Math.max(movedAt(b), 0) - Math.max(movedAt(a), 0) || reportedAt(b) - reportedAt(a));
}
