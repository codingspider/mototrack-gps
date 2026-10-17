// The "Incoming call alert" switch of Alarm settings, kept on the phone (a phone setting, not account data). Read by
// the push handler in index.js too, which runs while the app is closed, so it cannot live in Redux only.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_call_alert_enabled';

/** @returns {Promise<boolean>} On unless the customer switched it off */
export async function loadCallAlertEnabled() {
  try {
    return (await AsyncStorage.getItem(STORAGE_KEY)) !== 'false';
  } catch (error) {
    return true;
  }
}

/** @param {boolean} isEnabled */
export async function saveCallAlertEnabled(isEnabled) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, isEnabled ? 'true' : 'false');
  } catch (error) {
    // Not saved: stays as it was
  }
}
