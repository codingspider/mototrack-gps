// Logged-in screens: the bottom tabs, plus Profile which opens from the Home header.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import MainTabs from './MainTabs';
import AccountPage from '../pages/Account/AccountPage';
import AlertLocationPage from '../pages/AlertLocation/AlertLocationPage';
import LegalPage from '../pages/LegalPage/LegalPage';
import WarrantyPage from '../pages/Warranty/WarrantyPage';
import CertificatesPage from '../pages/Certificates/CertificatesPage';
import CertificateViewPage from '../pages/Certificates/CertificateViewPage';
import PointLocationPage from '../pages/PointLocation/PointLocationPage';
import AlarmSettingsPage from '../pages/AlarmSettings/AlarmSettingsPage';
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
import { useTranslation } from '../i18n/LanguageContext';

const Stack = createNativeStackNavigator();

export default function MainStack() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text }}>
      <Stack.Screen name={routeNames.mainTabs} component={MainTabs} options={{ headerShown: false }} />
      {/* The Profile screen draws its own colored header */}
      <Stack.Screen name={routeNames.account} component={AccountPage} options={{ headerShown: false }} />
      <Stack.Screen name={routeNames.playback} component={PlaybackPage} options={{ title: t('title.playback') }} />
      <Stack.Screen name={routeNames.overspeed} component={OverspeedPage} options={{ title: t('title.overspeed') }} />
      <Stack.Screen name={routeNames.reportSummary} component={ReportSummaryPage} options={{ title: t('title.reports') }} />
      <Stack.Screen name={routeNames.fuelSettings} component={FuelSettingsPage} options={{ title: t('title.fuelSettings') }} />
      <Stack.Screen name={routeNames.deviceAlerts} component={DeviceAlertsPage} options={{ title: t('title.alarms') }} />
      <Stack.Screen name={routeNames.alarmSettings} component={AlarmSettingsPage} options={{ title: t('title.alarmSettings') }} />
      <Stack.Screen name={routeNames.alertLocation} component={AlertLocationPage} options={{ title: t('title.alertLocation') }} />
      <Stack.Screen name={routeNames.warranty} component={WarrantyPage} options={{ title: t('title.warranty') }} />
      <Stack.Screen name={routeNames.certificates} component={CertificatesPage} options={{ title: t('title.certificates') }} />
      <Stack.Screen
        name={routeNames.certificateView}
        component={CertificateViewPage}
        options={({ route }) => ({ title: route.params.title || t('title.certificates') })}
      />
      <Stack.Screen
        name={routeNames.legal}
        component={LegalPage}
        options={({ route }) => ({ title: route.params.title })}
      />
      <Stack.Screen name={routeNames.pointLocation} component={PointLocationPage} options={{ title: t('title.location') }} />
      <Stack.Screen name={routeNames.routeFinder} component={RouteFinderPage} options={{ title: t('title.routeFinder') }} />
      <Stack.Screen name={routeNames.geofences} component={GeofencesPage} options={{ title: t('title.geofences') }} />
      <Stack.Screen name={routeNames.geofenceEditor} component={GeofenceEditorPage} options={{ title: t('title.geofence') }} />
      <Stack.Screen name={routeNames.payments} component={PaymentsPage} options={{ title: t('title.renew') }} />
      <Stack.Screen
        name={routeNames.paymentCheckout}
        component={PaymentCheckoutPage}
        options={{ title: 'DGePay', gestureEnabled: false }}
      />
      <Stack.Screen
        name={routeNames.vehicleDetails}
        component={VehicleDetailsPage}
        options={{ title: t('title.vehicleDetails') }}
      />
    </Stack.Navigator>
  );
}
