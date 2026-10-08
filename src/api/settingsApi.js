// Home-screen sliders and the app settings (name and logos).
import client from './client';
import endpoints from './endpoints';

/**
 * Get active home sliders (V1\SlidersController@index), already sorted.
 * Response:
 * { status: 1, items: [{ id, title, image, link, active, order, created_at, updated_at }] }
 * `image` is a full URL or '' when the slider has no picture.
 */
export async function getSliders() {
  const response = await client.get(endpoints.sliders);
  return response.data;
}

/**
 * Get the app name and logos (GET /app-settings). Public: works before login, so the login screen can show the logo.
 * Real response:
 * {
 *   status: 1,
 *   item: {
 *     app_name: 'MOTOTRACK',
 *     logo: 'https://mototrack24.com/images/logo.png?t=1791116010',            // 594 x 191 px, transparent
 *     logo_login: 'https://mototrack24.com/images/logo-main.png?t=1789386216', // only 150 x 100 px
 *     favicon: 'https://mototrack24.com/images/favicon.png?t=1790053205'
 *   }
 * }
 * The `?t=` number changes when the logo is replaced, so a changed link means a new picture.
 */
export async function getAppSettings() {
  const response = await client.get(endpoints.appSettings);
  return response.data;
}
