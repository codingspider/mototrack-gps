// Logged-in screens: the bottom tabs, plus Profile which opens from the Home header.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import AccountPage from '../pages/Account/AccountPage';
import OverspeedPage from '../pages/Overspeed/OverspeedPage';
import PlaybackPage from '../pages/Playback/PlaybackPage';
import VehicleDetailsPage from '../pages/VehicleDetails/VehicleDetailsPage';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text }}>
      <Stack.Screen name="MainTabs" component={MainTabs} options={{ headerShown: false }} />
      <Stack.Screen name={routeNames.account} component={AccountPage} options={{ title: 'Profile' }} />
      <Stack.Screen name={routeNames.playback} component={PlaybackPage} options={{ title: 'Playback' }} />
      <Stack.Screen name={routeNames.overspeed} component={OverspeedPage} options={{ title: 'Overspeed limit' }} />
      <Stack.Screen
        name={routeNames.vehicleDetails}
        component={VehicleDetailsPage}
        options={{ title: 'Vehicle details' }}
      />
    </Stack.Navigator>
  );
}
