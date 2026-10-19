// Rings the phone like a call for a power cut or geofence in / out push, unless the customer switched that kind of
// call alert off. Each kind plays its own recorded message when answered.
// Used by the push handlers in index.js (app closed / in the background) and usePushNotifications (app open).
import { getCallAlertMessage, getCallAlertReason, getCallAlertText } from './callAlert';
import { loadCallAlertEnabled } from './callAlertStorage';
import { showCallAlert } from './appNotification';

/**
 * @param {object} remoteMessage Message from Firebase messaging
 * @param {{ title: string, body: string }|null} pushText From getPushText
 * @returns {Promise<boolean>} true when it rang
 */
export async function ringIfCallAlert(remoteMessage, pushText) {
  const reason = pushText ? getCallAlertReason(remoteMessage) : null;
  if (!reason) {
    return false;
  }
  if (!(await loadCallAlertEnabled(reason))) {
    return false;
  }
  const { caller, detail } = getCallAlertText(pushText, (remoteMessage && remoteMessage.data) || {});
  showCallAlert(caller, detail, getCallAlertMessage(reason));
  return true;
}
