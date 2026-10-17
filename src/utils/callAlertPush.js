// Rings the phone like a call for a power cut or geofence out push, unless the customer switched call alerts off.
// Used by the push handlers in index.js (app closed / in the background) and usePushNotifications (app open).
import { getCallAlertReason, getCallAlertText } from './callAlert';
import { loadCallAlertEnabled } from './callAlertStorage';
import { showCallAlert } from './appNotification';

/**
 * @param {object} remoteMessage Message from Firebase messaging
 * @param {{ title: string, body: string }|null} pushText From getPushText
 * @returns {Promise<boolean>} true when it rang
 */
export async function ringIfCallAlert(remoteMessage, pushText) {
  if (!pushText || !getCallAlertReason(remoteMessage)) {
    return false;
  }
  if (!(await loadCallAlertEnabled())) {
    return false;
  }
  const { caller, detail } = getCallAlertText(pushText);
  showCallAlert(caller, detail);
  return true;
}
