// The customer's own account: the legal pages (terms, privacy) and deleting the account.
import client from './client';
import endpoints from './endpoints';

/**
 * The legal pages the app shows in a web view (GET /legal-pages, public, V1\\LegalPagesController@index):
 * { status: 1, items: [{ slug: 'terms_conditions', title: 'Terms and Conditions', url: 'https://.../legal/terms_conditions' },
 *                      { slug: 'privacy_policy', title: 'Privacy Policy', url: '...' }] }
 * NOT SEEN with a real response yet: written from the controller.
 */
export async function getLegalPages() {
  const response = await client.get(endpoints.legalPages);
  return response.data;
}

/**
 * Delete the logged-in customer's account (POST /delete_account, V1\\AccountController@destroy). The server soft deletes
 * it: the customer cannot log in any more, an admin can restore it.
 * Body: { password, reason? }.
 * Answers: { status: 1, message }
 *          HTTP 422 { status: 0, message: 'The password is not correct' }
 *          HTTP 403 { status: 0, message } for an admin / manager account
 * @param {string} password The customer's current password, to confirm
 * @param {string} reason Optional short reason
 */
export async function deleteAccount(password, reason = '') {
  const response = await client.post(endpoints.deleteAccount, { password, reason });
  return response.data;
}
