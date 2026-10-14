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
