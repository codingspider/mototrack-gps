// Picks AuthStack or MainStack from the login state.
import React, { useEffect } from 'react';
import { StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AuthStack from './AuthStack';
import MainStack from './MainStack';
import { restoreSession, selectIsLoggedIn } from '../store/slices/authSlice';
import { useThemedStyles } from '../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    blank: { flex: 1, backgroundColor: colors.background },
  });

export default function RootNavigator() {
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const isRestoring = useSelector((state) => state.auth.isRestoring);
  const isLoggedIn = useSelector(selectIsLoggedIn);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  // Checking Keychain takes a moment: show an empty background, not a flash of Login.
  if (isRestoring) {
    return <View style={styles.blank} />;
  }

  return isLoggedIn ? <MainStack /> : <AuthStack />;
}
