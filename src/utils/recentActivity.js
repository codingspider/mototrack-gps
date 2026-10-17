// Which vehicles count as "recent activity" on Home: every vehicle that MOVED in the last few hours. Pure function.
// A vehicle counts when its location last changed inside the window (even if it is parked or offline now), or when it
// is moving right now and reported inside the window. A vehicle that only idles or has its engine on without moving
// does not count.
import { STATUS_MOVING, STATUS_SUSPENDED } from './vehicleStatus';

export const RECENT_ACTIVITY_HOURS = 3;

/**
 * When the vehicle last moved, in unix seconds (0 when unknown). A vehicle moving now moved at its last report.
 * `last_moved_stamp` comes from the server (GET /vehicles and GET /vehicles/recent-activity) and the live socket.
 * @param {object} vehicle Vehicle from Redux
 */
export function getLastMovedAt(vehicle) {
  const movedAt = Number(vehicle.last_moved_stamp) || 0;
  const reportedAt = Number(vehicle.last_position_stamp) || 0;
  if (vehicle.status === STATUS_MOVING) {
    return Math.max(movedAt, reportedAt);
  }
  return movedAt;
}

/**
 * @param {Array<object>} vehicles Vehicles from Redux
 * @param {number} nowMs Current time in milliseconds
 * @returns {Array<object>} The vehicles that moved in the window, the one that moved last first
 */
export function getRecentActivityVehicles(vehicles, nowMs = Date.now()) {
  const sinceSeconds = nowMs / 1000 - RECENT_ACTIVITY_HOURS * 3600;

  return vehicles
    .filter((vehicle) => vehicle.status !== STATUS_SUSPENDED && getLastMovedAt(vehicle) >= sinceSeconds)
    .sort((a, b) => getLastMovedAt(b) - getLastMovedAt(a));
}
