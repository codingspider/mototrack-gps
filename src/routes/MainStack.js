// Logged-in screens: the bottom tabs, plus Profile which opens from the Home header.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import AccountPage from '../pages/Account/AccountPage';
import DeviceAlertsPage from '../pages/DeviceAlerts/DeviceAlertsPage';
import FuelSettingsPage from '../pages/FuelSettings/FuelSettingsPage';
import GeofenceEditorPage from '../pages/GeofenceEditor/GeofenceEditorPage';
import GeofencesPage from '../pages/Geofences/GeofencesPage';
import OverspeedPage from '../pages/Overspeed/OverspeedPage';
import PaymentCheckoutPage from '../pages/PaymentCheckout/PaymentCheckoutPage';
import PaymentsPage from '../pages/Payments/PaymentsPage';
import PlaybackPage from '../pages/Playback/PlaybackPage';
import ReportSummaryPage from '../pages/ReportSummary/ReportSummaryPage';
import RouteFinderPage from '../pages/RouteFinder/RouteFinderPage';
import VehicleDetailsPage from '../pages/VehicleDetails/VehicleDetailsPage';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text }}>
      <Stack.Screen name={routeNames.mainTabs} component={MainTabs} options={{ headerShown: false }} />
      {/* The Profile screen draws its own colored header */}
      <Stack.Screen name={routeNames.account} component={AccountPage} options={{ headerShown: false }} />
      <Stack.Screen name={routeNames.playback} component={PlaybackPage} options={{ title: 'Playback' }} />
      <Stack.Screen name={routeNames.overspeed} component={OverspeedPage} options={{ title: 'Overspeed limit' }} />
      <Stack.Screen name={routeNames.reportSummary} component={ReportSummaryPage} options={{ title: 'Reports' }} />
      <Stack.Screen name={routeNames.fuelSettings} component={FuelSettingsPage} options={{ title: 'Fuel settings' }} />
      <Stack.Screen name={routeNames.deviceAlerts} component={DeviceAlertsPage} options={{ title: 'Alarms' }} />
      <Stack.Screen name={routeNames.routeFinder} component={RouteFinderPage} options={{ title: 'Route finder' }} />
      <Stack.Screen name={routeNames.geofences} component={GeofencesPage} options={{ title: 'Geofences' }} />
      <Stack.Screen name={routeNames.geofenceEditor} component={GeofenceEditorPage} options={{ title: 'Geofence' }} />
      <Stack.Screen name={routeNames.payments} component={PaymentsPage} options={{ title: 'Renew service' }} />
      <Stack.Screen
        name={routeNames.paymentCheckout}
        component={PaymentCheckoutPage}
        options={{ title: 'DGePay', gestureEnabled: false }}
      />
      <Stack.Screen
        name={routeNames.vehicleDetails}
        component={VehicleDetailsPage}
        options={{ title: 'Vehicle details' }}
      />
    </Stack.Navigator>
  );
}
