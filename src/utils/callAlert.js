// Which alerts ring the phone like an incoming call (power cut and geofence out), and the words on the call screen.
// Pure functions. The server marks these pushes with data.call_alert = '1' and sends them data-only, so the app is
// woken up even when it is closed; the type and the words are checked too, for pushes from an older server.

export const CALL_ALERT_CALLER = 'MotoTrack Alert';

/** Event types of a vehicle leaving a geofence. */
const GEOFENCE_OUT_TYPES = ['zone_out', 'geofence_out'];

/** Words of a power cut alert, e.g. "Power cut" or the "Vehicle Power Disconnected" alarm. */
const POWER_CUT_WORDS = ['power cut', 'power disconnect'];

/**
 * Why this push should ring, or null when it should not.
 * @param {object} remoteMessage Message from Firebase messaging ({ notification?, data? })
 * @returns {'powerCut'|'geofenceOut'|null}
 */
export function getCallAlertReason(remoteMessage) {
  const data = (remoteMessage && remoteMessage.data) || {};
  const notification = (remoteMessage && remoteMessage.notification) || {};
  const words = [notification.title, notification.body, data.title, data.body, data.message]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();

  if (POWER_CUT_WORDS.some((word) => words.includes(word))) {
    return 'powerCut';
  }
  if (GEOFENCE_OUT_TYPES.includes(String(data.type || '').toLowerCase())) {
    return 'geofenceOut';
  }
  // Marked by the server but worded in a way we do not know: still ring
  if (String(data.call_alert) === '1') {
    return words.includes('zone') || words.includes('geofence') ? 'geofenceOut' : 'powerCut';
  }
  return null;
}

/**
 * Caller and detail line for the call screen, e.g. { caller: 'MotoTrack Alert', detail: 'Bogura NA 11-1516 Power cut' }.
 * The detail is the alert title (vehicle name + alert), or the body when there is no title.
 * @param {{ title: string, body: string }} pushText From getPushText
 */
export function getCallAlertText(pushText) {
  const title = ((pushText && pushText.title) || '').trim();
  const body = ((pushText && pushText.body) || '').trim();
  return { caller: CALL_ALERT_CALLER, detail: title || body };
}
