// Which alarm rules belong to the customer's account settings, and which alerts the switches hide. Pure functions.
//
// GET /get_alerts returns every alert rule of the account in one list:
//  - per-vehicle rules made by the vehicle screens: "Overspeed limit - <vehicle>" (type overspeed) and
//    "<geofence> - <vehicle>" (type geofence_in / geofence_out), each with ONE vehicle in `devices`;
//  - account alarms such as "Vehicle Power Disconnected" or "GSM Jamming Alert" (type custom), which cover every vehicle.
// The Alarm settings page shows only the second kind: the per-vehicle rules are managed on each vehicle's own
// Overspeed and Geofence screens.

/** Alert types that the vehicle screens create, one rule per vehicle. */
export const PER_VEHICLE_TYPES = ['overspeed', 'geofence_in', 'geofence_out', 'zone_in', 'zone_out'];

/**
 * True for a rule that belongs to the account settings (shown on the Alarm settings page).
 * @param {{ type?: string, deviceCount?: number|null }} alarm One row from parseAlerts
 */
export function isAccountAlarm(alarm) {
  const isVehicleRule = PER_VEHICLE_TYPES.includes(alarm.type) && (alarm.deviceCount === null || alarm.deviceCount <= 1);
  return !isVehicleRule;
}

/** Lower case names of the account alarms that are switched off. Names shorter than 4 letters are ignored. */
export function getDisabledAlarmNames(alarms) {
  return alarms
    .filter((alarm) => isAccountAlarm(alarm) && !alarm.active)
    .map((alarm) => String(alarm.name || '').trim().toLowerCase())
    .filter((name) => name.length >= 4);
}

/**
 * True when a text (an alert title or message) is about an alarm that is switched off, e.g. the text
 * "Bogura NA 11-1516 GSM Jamming Alert" and the switched-off alarm "GSM Jamming Alert".
 * @param {string[]} texts The title and the message of the alert
 * @param {string[]} disabledNames From getDisabledAlarmNames
 */
export function isAboutDisabledAlarm(texts, disabledNames) {
  if (!disabledNames || disabledNames.length === 0) {
    return false;
  }
  const lowered = texts.filter(Boolean).map((text) => String(text).toLowerCase());
  return disabledNames.some((name) => lowered.some((text) => text.includes(name)));
}

/** True when an alert of GET /notifications is about a switched-off alarm, so the app should not show it. */
export function isAlertHidden(item, disabledNames) {
  return isAboutDisabledAlarm([item && item.title, item && item.message], disabledNames);
}
