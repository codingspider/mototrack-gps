// The call alert switches of Alarm settings (power cut, geofence in, geofence out), kept on the phone (a phone setting,
// not account data). Read by the push handler in index.js too, which runs while the app is closed, so they cannot
// live in Redux only. Every switch is on unless the customer switched it off.
import AsyncStorage from '@react-native-async-storage/async-storage';

// The power cut key is the one the single "Incoming call alert" switch used, so that choice is kept
const STORAGE_KEYS = {
  powerCut: 'mototrack_call_alert_enabled',
  geofenceIn: 'mototrack_call_alert_geofence_in',
  geofenceOut: 'mototrack_call_alert_geofence_out',
};

/**
 * @param {'powerCut'|'geofenceIn'|'geofenceOut'} reason
 * @returns {Promise<boolean>} On unless the customer switched it off
 */
export async function loadCallAlertEnabled(reason = 'powerCut') {
  const key = STORAGE_KEYS[reason];
  if (!key) {
    return false;
  }
  try {
    return (await AsyncStorage.getItem(key)) !== 'false';
  } catch (error) {
    return true;
  }
}

/**
 * @param {'powerCut'|'geofenceIn'|'geofenceOut'} reason
 * @param {boolean} isEnabled
 */
export async function saveCallAlertEnabled(reason, isEnabled) {
  const key = STORAGE_KEYS[reason];
  if (!key) {
    return;
  }
  try {
    await AsyncStorage.setItem(key, isEnabled ? 'true' : 'false');
  } catch (error) {
    // Not saved: stays as it was
  }
}
