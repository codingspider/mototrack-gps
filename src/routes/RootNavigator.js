// Picks AuthStack or MainStack from the login state.
import React, { useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { loadCachedAlarmNames } from '../store/slices/alarmSettingsSlice';
import { fetchAppSettings, loadCachedSettings } from '../store/slices/appSlice';
import { restoreSession, selectIsLoggedIn } from '../store/slices/authSlice';
import BootScreen from '../components/common/BootScreen';

export default function RootNavigator() {
  const dispatch = useDispatch();
  const isRestoring = useSelector((state) => state.auth.isRestoring);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    dispatch(restoreSession());
    // Logo: show the saved one at once, and check the server for a newer one in the background
    dispatch(loadCachedSettings());
    // Names of the switched-off alarms: their alerts stay hidden from the first screen
    dispatch(loadCachedAlarmNames());
    dispatch(fetchAppSettings());
  }, [dispatch]);

  // Checking Keychain takes a moment: show the launch picture (primary color + white logo), not a flash of Login.
  if (isRestoring) {
    return <BootScreen />;
  }

  return isLoggedIn ? <MainStack /> : <AuthStack />;
}
