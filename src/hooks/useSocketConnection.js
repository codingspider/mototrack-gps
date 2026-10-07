// Keeps the live socket connected while the user is logged in and the app is open.
import { useEffect } from 'react';
import { AppState } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { connectSocket, disconnectSocket } from '../socket/socketClient';
import { fetchVehicles } from '../store/slices/vehiclesSlice';
import { selectUserId } from '../store/slices/authSlice';

export default function useSocketConnection() {
  const dispatch = useDispatch();
  const userId = useSelector(selectUserId);

  useEffect(() => {
    if (!userId) {
      return undefined;
    }
    connectSocket(userId, dispatch);

    // Close in background, reconnect on return and re-fetch once to catch missed moves.
    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        connectSocket(userId, dispatch);
        dispatch(fetchVehicles({ force: true }));
      } else if (nextState === 'background') {
        disconnectSocket();
      }
    });

    return () => {
      subscription.remove();
      disconnectSocket();
    };
  }, [userId, dispatch]);
}