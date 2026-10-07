// Login and password reset calls.
import client from './client';
import endpoints from './endpoints';

/**
 * Log in with email OR phone number (the server accepts a phone in the `email` field).
 * Real response (ApiController@login):
 * { status: 1, userId: 12, user_api_hash: '$2y$10$...', permissions: {...} }
 * Failed login: HTTP 401 { status: 0, message: '...' }
 * @param {string} emailOrPhone
 * @param {string} password
 */
export async function login(emailOrPhone, password) {
  const response = await client.post(endpoints.login, {
    email: emailOrPhone,
    password,
  });
  return response.data;
}

/**
 * Step 1 of password reset: the server sends a 6 digit code by SMS.
 * Response: { success: 1 }. Limited to 2 requests per minute.
 * @param {string} phoneNumber e.g. 01712345678
 */
export async function requestPasswordCode(phoneNumber) {
  const response = await client.get(endpoints.passwordReminder, {
    params: { phone_number: phoneNumber },
  });
  return response.data;
}

/**
 * Step 2 of password reset: send the SMS code and the new password.
 * Response: { success: 1 }
 * @param {string} phoneNumber
 * @param {string} code 6 digit code from SMS
 * @param {string} password New password
 */
export async function resetPassword(phoneNumber, code, password) {
  const response = await client.post(endpoints.passwordReminder, {
    phone_number: phoneNumber,
    code,
    password,
  });
  return response.data;
}