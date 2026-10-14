// The names of the alarms that are switched off, kept on the phone (not a secret). They let the app hide those alerts
// from the first screen, before the alarm list has been loaded, and from a push that arrives while the app is closed.
import AsyncStorage from '@react-native-async-storage/async-storage';

const STORAGE_KEY = 'mototrack_disabled_alarm_names';

/** @param {string[]} names From getDisabledAlarmNames */
export async function saveDisabledAlarmNames(names) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(names));
  } catch (error) {
    // Not saved: the next load of the alarm list saves it again
  }
}

/** @returns {Promise<string[]>} Empty when nothing was saved yet */
export async function loadDisabledAlarmNames() {
  try {
    const text = await AsyncStorage.getItem(STORAGE_KEY);
    const names = text ? JSON.parse(text) : [];
    return Array.isArray(names) ? names : [];
  } catch (error) {
    return [];
  }
}
