// Profile call.
import client from './client';
import endpoints from './endpoints';

/**
 * Get the logged-in customer's profile (V1\ProfileController@show).
 * Response:
 * { status: 1, item: { first_name, last_name, date_of_birth, address, phone_number, photo_url } }
 */
export async function getProfile() {
  const response = await client.get(endpoints.profile);
  return response.data;
}

/**
 * Change the password (POST /change_password, MyAccountSettingsController@ChangePassword).
 * Body: { password, password_confirmation }. The server does NOT ask for the old password.
 * Answers: { status: 1, id }
 *          HTTP 422 { status: 0, errors: { password: ['The password must contain...'] } } (its password rules)
 * @param {string} password The new password
 * @param {string} confirmation The same password again
 */
export async function changePassword(password, confirmation) {
  const response = await client.post(endpoints.changePassword, {
    password,
    password_confirmation: confirmation,
  });
  return response.data;
}
