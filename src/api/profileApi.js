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