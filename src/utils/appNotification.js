// Alerts in the phone's notification drawer, drawn by the native AppNotification module
// (android/app/src/main/java/com/mototrackpro/AppNotificationModule.kt).
import { NativeModules, Platform } from 'react-native';

const { AppNotification } = NativeModules;

/**
 * The words of a push, whether the server put them in the `notification` part or only in `data`.
 * @param {object} remoteMessage Message from Firebase messaging
 * @returns {{ title: string, body: string }|null} null when the push has nothing to show
 */
export function getPushText(remoteMessage) {
  const notification = (remoteMessage && remoteMessage.notification) || {};
  const data = (remoteMessage && remoteMessage.data) || {};
  const title = notification.title || data.title || '';
  const body = notification.body || data.body || data.message || '';
  if (!title && !body) {
    return null;
  }
  return { title: String(title), body: String(body) };
}

/** Put an alert in the notification drawer. Does nothing outside Android or when the module is missing. */
export function showAlertNotification(title, body) {
  if (Platform.OS !== 'android' || !AppNotification) {
    return;
  }
  AppNotification.show(title, body);
}

/**
 * Ring like an incoming call (power cut, geofence out). Answering it plays the recorded message.
 * @param {string} caller Name on the call screen
 * @param {string} detail Line under the name (vehicle + alert)
 */
export function showCallAlert(caller, detail) {
  if (Platform.OS !== 'android' || !AppNotification || !AppNotification.showCallAlert) {
    return;
  }
  AppNotification.showCallAlert(caller, detail);
}

/** False when the phone does not let the call open over the lock screen (Android 14+ "Full screen notifications"). */
export async function canUseFullScreenAlerts() {
  if (Platform.OS !== 'android' || !AppNotification || !AppNotification.canUseFullScreen) {
    return true;
  }
  try {
    return await AppNotification.canUseFullScreen();
  } catch (error) {
    return true;
  }
}

/** Open the phone setting where full-screen alerts are allowed for this app. */
export function openFullScreenAlertSettings() {
  if (Platform.OS === 'android' && AppNotification && AppNotification.openFullScreenSettings) {
    AppNotification.openFullScreenSettings();
  }
}

/** True once when the app was opened by tapping one of our drawer notifications. */
export async function consumeOpenedFromAlert() {
  if (Platform.OS !== 'android' || !AppNotification) {
    return false;
  }
  try {
    return await AppNotification.consumeOpenedFromAlert();
  } catch (error) {
    return false;
  }
}
