// Which alerts ring the phone like an incoming call (power cut, geofence in, geofence out), which recorded message each
// one plays when answered, and the words on the call screen. Pure functions. The server marks these pushes with
// data.call_alert = '1' and sends them data-only, so the app is woken up even when it is closed; the type and the words
// are checked too, for pushes from an older server.

export const CALL_ALERT_CALLER = 'MotoTrack Alert';

/** The kinds of call alert. Each one has its own switch in Alarm settings. */
export const CALL_ALERT_REASONS = ['powerCut', 'geofenceIn', 'geofenceOut'];

/** The recorded message each kind plays when answered (files in android/app/src/main/res/raw, without .mp3). */
export const CALL_ALERT_MESSAGES = {
  powerCut: 'call_alert_message',
  geofenceIn: 'geofence_in_alert_message',
  geofenceOut: 'geofence_out_alert_message',
};

/** Event types of a vehicle entering / leaving a geofence. */
const GEOFENCE_IN_TYPES = ['zone_in', 'geofence_in'];
const GEOFENCE_OUT_TYPES = ['zone_out', 'geofence_out'];

/** Words of a power cut alert, e.g. "Power cut" or the "Vehicle Power Disconnected" alarm. */
const POWER_CUT_WORDS = ['power cut', 'power disconnect'];

/** Words of a geofence entry, for a marked push without a type. */
const GEOFENCE_IN_WORDS = ['zone in', 'zone_in', 'geofence in', 'entered', 'enters'];

/**
 * Why this push should ring, or null when it should not.
 * @param {object} remoteMessage Message from Firebase messaging ({ notification?, data? })
 * @returns {'powerCut'|'geofenceIn'|'geofenceOut'|null}
 */
export function getCallAlertReason(remoteMessage) {
  const data = (remoteMessage && remoteMessage.data) || {};
  const notification = (remoteMessage && remoteMessage.notification) || {};
  const words = [notification.title, notification.body, data.title, data.body, data.message]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  const type = String(data.type || '').toLowerCase();

  if (POWER_CUT_WORDS.some((word) => words.includes(word))) {
    return 'powerCut';
  }
  if (GEOFENCE_IN_TYPES.includes(type)) {
    return 'geofenceIn';
  }
  if (GEOFENCE_OUT_TYPES.includes(type)) {
    return 'geofenceOut';
  }
  // Marked by the server but without a type we know: go by the words, and still ring
  if (String(data.call_alert) === '1') {
    if (GEOFENCE_IN_WORDS.some((word) => words.includes(word))) {
      return 'geofenceIn';
    }
    return words.includes('zone') || words.includes('geofence') ? 'geofenceOut' : 'powerCut';
  }
  return null;
}

/** The recorded message for a kind of call alert (the power cut message for anything unknown). */
export function getCallAlertMessage(reason) {
  return CALL_ALERT_MESSAGES[reason] || CALL_ALERT_MESSAGES.powerCut;
}

const clean = (value) => (value === null || value === undefined ? '' : String(value).trim());

/**
 * The big name and the line under it on the call screen: the vehicle's name, then its number plate and the alert.
 * @param {{ vehicleName?: string, plate?: string, alertText?: string }} parts
 * @returns {{ caller: string, detail: string }} e.g. { caller: 'Honda SP160', detail: 'DM GA 32-4468 · Zone in' }
 */
export function buildCallScreenText({ vehicleName, plate, alertText } = {}) {
  const name = clean(vehicleName);
  const plateText = clean(plate);
  const caller = name || plateText || CALL_ALERT_CALLER;
  // The plate under the name, unless it is the name already
  const showPlate = plateText && plateText.toLowerCase() !== caller.toLowerCase();
  const detail = [showPlate ? plateText : '', clean(alertText)].filter(Boolean).join(' · ');
  return { caller, detail };
}

/**
 * Caller and detail line for the call screen of a push: the vehicle's name big, its plate and the alert under it,
 * e.g. { caller: 'Honda SP160', detail: 'DM GA 32-4468 · Power cut' }.
 * The server sends `vehicle_name` and `plate_number` (newer servers); for an older push the vehicle is read from the
 * title, which is "<vehicle name> <alert message>".
 * @param {{ title: string, body: string }} pushText From getPushText
 * @param {object} data The push data (remoteMessage.data)
 */
export function getCallAlertText(pushText, data = {}) {
  const title = clean(pushText && pushText.title);
  const body = clean(pushText && pushText.body);
  const message = clean(data && data.message);
  let vehicleName = clean(data && data.vehicle_name);
  let alertText = '';

  if (vehicleName && title.toLowerCase().startsWith(vehicleName.toLowerCase())) {
    alertText = title.slice(vehicleName.length).trim();
  } else if (!vehicleName && message && title.length > message.length && title.toLowerCase().endsWith(message.toLowerCase())) {
    vehicleName = title.slice(0, title.length - message.length).trim();
    alertText = message;
  }
  if (!vehicleName) {
    // Vehicle unknown: keep the whole title under "MotoTrack Alert", as before
    return buildCallScreenText({ plate: data && data.plate_number, alertText: title || body });
  }
  return buildCallScreenText({ vehicleName, plate: data && data.plate_number, alertText: alertText || message || body });
}
