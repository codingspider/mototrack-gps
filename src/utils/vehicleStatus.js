// Vehicle status helpers. Status labels come from the server (GET /vehicles).

export const STATUS_MOVING = 'Moving';
export const STATUS_IDLING = 'Idling';
export const STATUS_ENGINE_OFF = 'Engine Off';
export const STATUS_OFFLINE = 'Offline';
export const STATUS_SUSPENDED = 'Suspended';

/**
 * Group a status label into one of: moving, idle, offline, suspended.
 * @param {string} status Label from the server
 */
export function getStatusGroup(status) {
  if (status === STATUS_MOVING) {
    return 'moving';
  }
  if (status === STATUS_IDLING || status === STATUS_ENGINE_OFF) {
    return 'idle';
  }
  if (status === STATUS_SUSPENDED) {
    return 'suspended';
  }
  return 'offline';
}

/**
 * Color for a status label (badges and map markers).
 * @param {string} status Label from the server
 * @param {object} colors The current palette from useAppTheme()
 */
export function getStatusColor(status, colors) {
  const group = getStatusGroup(status);
  if (group === 'moving') {
    return colors.statusMoving;
  }
  if (group === 'idle') {
    return colors.statusIdle;
  }
  if (group === 'suspended') {
    return colors.statusAlert;
  }
  return colors.statusOffline;
}

/**
 * New status label after a live socket position.
 * The socket only sends speed + online string, so we only change
 * Moving <-> Idling and Offline.
 * @param {string} currentStatus Label we already have
 * @param {number} speed Speed from the socket
 * @param {string} online 'online' | 'ack' | 'engine' | 'offline'
 */
export function getStatusAfterPosition(currentStatus, speed, online) {
  if (currentStatus === STATUS_SUSPENDED) {
    return currentStatus;
  }
  if (online === 'offline') {
    return STATUS_OFFLINE;
  }
  if (speed > 0) {
    return STATUS_MOVING;
  }
  if (currentStatus === STATUS_MOVING || currentStatus === STATUS_OFFLINE) {
    return STATUS_IDLING;
  }
  return currentStatus;
}