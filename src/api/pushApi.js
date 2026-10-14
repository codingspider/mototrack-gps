// Tells the server this phone's Firebase push token, so the server can send alerts to it.
import client from './client';
import endpoints from './endpoints';

/**
 * Save the push token of this phone for the logged-in customer (POST /fcm_token).
 * Response: { status: 1 }
 * @param {string} token FCM registration token
 */
export async function saveFcmToken(token) {
  const response = await client.post(endpoints.fcmToken, { token });
  return response.data;
}
