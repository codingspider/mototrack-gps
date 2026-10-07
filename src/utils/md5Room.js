// Socket room name for one user. Same formula as the web panel: md5('user_' + id).
import md5 from 'js-md5';

/** @param {number|string} userId */
export function getUserRoom(userId) {
  return md5('user_' + userId);
}