// Home-screen sliders.
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