// Keeps the login hash in Keychain (secret) and the user id in AsyncStorage (not secret).
import * as Keychain from 'react-native-keychain';
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEYCHAIN_SERVICE = 'mototrack24';
const USER_ID_KEY = 'mototrack_user_id';

/** Save the session after a successful login. */
export async function saveSession(userApiHash, userId) {
  await Keychain.setGenericPassword('user_api_hash', userApiHash, {
    service: KEYCHAIN_SERVICE,
  });
  await AsyncStorage.setItem(USER_ID_KEY, String(userId));
}

/** @returns {Promise<{userApiHash: string, userId: number}|null>} */
export async function loadSession() {
  const credentials = await Keychain.getGenericPassword({
    service: KEYCHAIN_SERVICE,
  });
  const userId = await AsyncStorage.getItem(USER_ID_KEY);
  if (!credentials || !userId) {
    return null;
  }
  return { userApiHash: credentials.password, userId: Number(userId) };
}

/** Remove the saved session (logout). */
export async function clearSession() {
  await Keychain.resetGenericPassword({ service: KEYCHAIN_SERVICE });
  await AsyncStorage.removeItem(USER_ID_KEY);
}