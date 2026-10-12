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

// "Remember me": the email / phone and password the customer chose to keep, in their own Keychain entry.
// It is separate from the session, so logging out does not remove it.
const LOGIN_SERVICE = 'mototrack24_login';

/** Keep the login for next time. */
export async function saveRememberedLogin(emailOrPhone, password) {
  await Keychain.setGenericPassword(emailOrPhone, password, {
    service: LOGIN_SERVICE,
  });
}

/** @returns {Promise<{emailOrPhone: string, password: string}|null>} */
export async function loadRememberedLogin() {
  const credentials = await Keychain.getGenericPassword({
    service: LOGIN_SERVICE,
  });
  if (!credentials) {
    return null;
  }
  return { emailOrPhone: credentials.username, password: credentials.password };
}

/** Forget the kept login (the customer unticked "Remember me"). */
export async function clearRememberedLogin() {
  await Keychain.resetGenericPassword({ service: LOGIN_SERVICE });
}
