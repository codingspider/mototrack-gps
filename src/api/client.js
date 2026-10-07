// The one shared axios client. Adds user_api_hash to every request and turns errors into plain messages.
import axios from 'axios';
import { API_BASE_URL } from '../config/env';

const client = axios.create({
  baseURL: API_BASE_URL,
  timeout: 15000,
  headers: { Accept: 'application/json' },
});

/** Pull a human message out of a Laravel error response. */
function getServerMessage(data) {
  if (!data) {
    return null;
  }
  if (typeof data.message === 'string') {
    return data.message;
  }
  // Validation errors look like { errors: { field: ['text'] } }
  if (data.errors) {
    const first = Object.values(data.errors)[0];
    return Array.isArray(first) ? first[0] : String(first);
  }
  return null;
}

/**
 * Call once at app start.
 * @param {object} store Redux store (we only read the saved hash from it)
 * @param {function} onUnauthorized Called when the server says the session is invalid
 */
export function setupInterceptors(store, onUnauthorized) {
  client.interceptors.request.use((config) => {
    const hash = store.getState().auth.userApiHash;
    if (!hash) {
      return config; // login / password reset have no hash yet
    }
    const method = (config.method || 'get').toLowerCase();
    if (method === 'get') {
      config.params = { ...config.params, user_api_hash: hash };
    } else {
      config.data = { ...config.data, user_api_hash: hash };
    }
    return config;
  });

  client.interceptors.response.use(
    (response) => response,
    (error) => {
      if (!error.response) {
        // Show the real reason while developing (axios has no response for timeouts, DNS and SSL errors too)
        __DEV__ && console.log('Network error:', error.code, error.message, error.config?.url);
        if (error.code === 'ECONNABORTED') {
          return Promise.reject(new Error('The server took too long to respond, please try again'));
        }
        return Promise.reject(new Error('No internet connection'));
      }
      const { status, data } = error.response;
      const hasSession = !!store.getState().auth.userApiHash;
      // Only 401 means "this login is no longer valid". A 403 is just "not allowed for this feature",
      // a timeout or no internet never logs out. The customer stays logged in until they tap Logout.
      if (status === 401 && hasSession) {
        onUnauthorized();
        return Promise.reject(
          new Error('Session expired, please log in again'),
        );
      }
      const message = getServerMessage(data) || 'Something went wrong, please try again';
      return Promise.reject(new Error(message));
    },
  );
}

export default client;