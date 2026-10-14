/**
 * @format
 */

import { AppRegistry } from 'react-native';
import { getMessaging, setBackgroundMessageHandler } from '@react-native-firebase/messaging';
import App from './App';
import { isAboutDisabledAlarm } from './src/utils/alarmSettings';
import { loadDisabledAlarmNames } from './src/utils/alarmStorage';
import { getPushText, showAlertNotification } from './src/utils/appNotification';
import { name as appName } from './app.json';

// Required by Firebase: a handler for pushes that arrive while the app is in the background or closed.
// A push with a notification part is drawn by Android itself. A data-only push is not, so draw it here.
setBackgroundMessageHandler(getMessaging(), async (remoteMessage) => {
  if (remoteMessage.notification) {
    return;
  }
  const text = getPushText(remoteMessage);
  if (!text) {
    return;
  }
  // Not for an alarm the customer switched off in Alarm settings (the names are saved on the phone)
  const disabledNames = await loadDisabledAlarmNames();
  if (!isAboutDisabledAlarm([text.title, text.body], disabledNames)) {
    showAlertNotification(text.title, text.body);
  }
});

AppRegistry.registerComponent(appName, () => App);
