// Remembers the app settings (logo links) on the phone, so the logo can show at once on the next start.
// Not a secret, so AsyncStorage is fine.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_app_settings';

/** @returns {Promise<object|null>} The settings saved last time, or null */
export async function loadCachedAppSettings() {
  try {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    return text ? JSON.parse(text) : null;
  } catch (error) {
    return null; // nothing saved, or storage not available: the app just fetches them
  }
}

/** @param {object} settings The `item` of the /app-settings response */
export async function saveAppSettings(settings) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  } catch (error) {
    // The logo still shows this time; it will just not be instant next time
  }
}
