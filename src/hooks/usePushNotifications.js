// Push notifications: asks permission, sends the FCM token to the server, shows pushes that
// arrive while the app is open as a toast, and opens the Alerts tab when a push is tapped.
import { useEffect, useRef } from 'react';
import { AppState, PermissionsAndroid, Platform } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {
  AuthorizationStatus,
  getInitialNotification,
  getMessaging,
  getToken,
  onMessage,
  onNotificationOpenedApp,
  onTokenRefresh,
  requestPermission,
} from '@react-native-firebase/messaging';
import { useDispatch, useSelector } from 'react-redux';
import { saveFcmToken } from '../api/pushApi';
import { fetchAlertBadge, fetchNotifications } from '../store/slices/notificationsSlice';
import routeNames from '../routes/routeNames';
import { selectDisabledAlarmNames } from '../store/slices/alarmSettingsSlice';
import { isAboutDisabledAlarm } from '../utils/alarmSettings';
import { consumeOpenedFromAlert, getPushText, showAlertNotification } from '../utils/appNotification';

const ANDROID_13 = 33;

/** Android 13+ needs the user to allow notifications. Older versions allow them by default. */
async function askPermission() {
  if (Platform.OS === 'android' && Platform.Version >= ANDROID_13) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.POST_NOTIFICATIONS);
    return result === PermissionsAndroid.RESULTS.GRANTED;
  }
  const status = await requestPermission(getMessaging());
  return status === AuthorizationStatus.AUTHORIZED || status === AuthorizationStatus.PROVISIONAL;
}

export default function usePushNotifications() {
  const dispatch = useDispatch();
  // The listeners below live as long as the screen, so they read the switched-off alarms through a ref
  const disabledAlarmNames = useSelector(selectDisabledAlarmNames);
  const disabledNamesRef = useRef(disabledAlarmNames);
  disabledNamesRef.current = disabledAlarmNames;
  const navigation = useNavigation();

  useEffect(() => {
    let isActive = true;
    // Alerts is a bottom tab: this hook lives above the tabs, so go through the tabs screen
    const openAlerts = () => navigation.navigate(routeNames.mainTabs, { screen: routeNames.alerts });
    const messagingInstance = getMessaging();

    async function register() {
      try {
        const isAllowed = await askPermission();
        if (!isAllowed || !isActive) {
          return;
        }
        const token = await getToken(messagingInstance);        if (token) {
          await saveFcmToken(token);
        }
      } catch (error) {
        // Push is optional: never block the app when Firebase is not set up
        __DEV__ && console.log('Push registration failed:', error.message);
      }
    }
    register();

    // The token can change (reinstall, restore): always tell the server the new one
    const unsubscribeToken = onTokenRefresh(messagingInstance, (token) => {
      saveFcmToken(token).catch(() => {});
    });

    // App is open: Android draws nothing, so the app puts the alert in the notification drawer itself
    // (no toast: the drawer is where alerts live) and refreshes the alerts list
    const unsubscribeMessage = onMessage(messagingInstance, async (remoteMessage) => {
      const text = getPushText(remoteMessage);
      // A push about an alarm that is switched off in Alarm settings is not shown
      if (text && !isAboutDisabledAlarm([text.title, text.body], disabledNamesRef.current)) {
        showAlertNotification(text.title, text.body);
      }
      dispatch(fetchNotifications({ force: true }));
      dispatch(fetchAlertBadge()); // the number on the Alerts tab
    });

    // Tapped while the app was in the background
    const unsubscribeOpened = onNotificationOpenedApp(messagingInstance, () => {
      openAlerts();
    });

    // Tapped while the app was closed
    getInitialNotification(messagingInstance)
      .then((remoteMessage) => {
        if (remoteMessage) {
          openAlerts();
        }
      })
      .catch(() => {});

    // Tapped one of the notifications the app drew itself (foreground or data-only pushes): open Alerts
    const openAlertsWhenTapped = async () => {
      if (await consumeOpenedFromAlert()) {
        openAlerts();
      }
    };
    openAlertsWhenTapped();
    const appStateSubscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        openAlertsWhenTapped();
      }
    });

    return () => {
      isActive = false;
      unsubscribeToken();
      unsubscribeMessage();
      unsubscribeOpened();
      appStateSubscription.remove();
    };
  }, [dispatch, navigation]);
}
