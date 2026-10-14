// When the customer last looked at the alerts (a Bangladesh time text), kept on the phone so the number on the Alerts tab
// does not start again from zero after the app is closed. Not a secret, so AsyncStorage is fine.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_alerts_seen_at';

/** @param {string} text e.g. "2026-10-13 15:24:10" */
export async function saveAlertsSeenAt(text) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, text);
  } catch (error) {
    // Not saved: the badge will count from the start of today next time
  }
}

/** @returns {Promise<string|null>} */
export async function readAlertsSeenAt() {
  try {
    return await AsyncStorage.getItem(STORAGE_KEY);
  } catch (error) {
    return null;
  }
}
