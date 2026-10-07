// The ONLY file that talks to the Socket.IO server. Needs socket.io-client v2 (server runs 2.1).
import io from 'socket.io-client';
import { SOCKET_URL } from '../config/env';
import { getUserRoom } from '../utils/md5Room';
import { vehiclePositionReceived } from '../store/slices/vehiclesSlice';
import { setSocketStatus } from '../store/slices/appSlice';

let socket = null;

/**
 * Connect and join this user's room. Safe to call twice.
 * @param {number} userId Numeric user id from the login response
 * @param {function} dispatch Redux dispatch
 */
export function connectSocket(userId, dispatch) {
  if (socket) {
    return;
  }

  const room = getUserRoom(userId);
  socket = io(SOCKET_URL, { transports: ['websocket'] });
  dispatch(setSocketStatus('connecting'));

  socket.on('connect', () => {
    socket.emit('join', room); // must join again after every reconnect
    dispatch(setSocketStatus('connected'));
  });

  socket.on('disconnect', () => dispatch(setSocketStatus('disconnected')));

  // One vehicle moved -> update it in Redux, every page updates automatically.
  socket.on('position', (data) => dispatch(vehiclePositionReceived(data)));
}

/** Close the connection (logout or app in background). */
export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}