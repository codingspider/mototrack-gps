// Bottom tabs for a logged-in customer (custom bar from the design, see AppTabBar).
import React, { useEffect } from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import LiveMapPage from '../pages/LiveMap/LiveMapPage';
import NotificationsPage from '../pages/Notifications/NotificationsPage';
import VehiclesPage from '../pages/Vehicles/VehiclesPage';
import ReportsStack from './ReportsStack';
import AppTabBar from '../components/common/AppTabBar';
import { renderBackToHomeButton } from '../components/common/BackToHomeButton';
import usePushNotifications from '../hooks/usePushNotifications';
import useSocketConnection from '../hooks/useSocketConnection';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';
import { useDispatch, useSelector } from 'react-redux';
import { loadAlertsSeenAt, selectAlertBadgeCount } from '../store/slices/notificationsSlice';
import { useTranslation } from '../i18n/LanguageContext';

const Tab = createBottomTabNavigator();

const tabIcons = {
  [routeNames.home]: 'home-outline',
  [routeNames.vehicles]: 'car-outline',
  [routeNames.map]: 'map-marker-outline',
  [routeNames.reports]: 'chart-bar',
  [routeNames.alerts]: 'bell-outline',
};

const tabLabelKeys = {
  [routeNames.home]: 'tab.home',
  [routeNames.vehicles]: 'tab.vehicle',
  [routeNames.map]: 'tab.live',
  [routeNames.reports]: 'tab.report',
  [routeNames.alerts]: 'tab.alerts',
};

function renderTabIcon(routeName, color, size) {
  return <Icon name={tabIcons[routeName]} color={color} size={size} />;
}

function renderTabBar(props) {
  return <AppTabBar {...props} />;
}

export default function MainTabs() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const alertBadgeCount = useSelector(selectAlertBadgeCount);
  // When the customer last looked at the alerts, then how many are new since (the number on the Alerts tab)
  useEffect(() => {
    dispatch(loadAlertsSeenAt());
  }, [dispatch]);
  // Starts live tracking as soon as the user is inside the app
  useSocketConnection();
  // Registers this phone for push notifications and handles taps on them
  usePushNotifications();

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        headerLeft: renderBackToHomeButton,
        tabBarLabel: t(tabLabelKeys[route.name]),
        tabBarBadge: route.name === routeNames.alerts && alertBadgeCount > 0 ? alertBadgeCount : undefined,
        tabBarIcon: ({ color, size }) => renderTabIcon(route.name, color, size),
      })}
    >
      {/* Home draws its own header (logo, alerts, profile) like the design */}
      <Tab.Screen name={routeNames.home} component={DashboardPage} options={{ headerShown: false }} />
      <Tab.Screen name={routeNames.vehicles} component={VehiclesPage} options={{ title: t('title.vehicles') }} />
      <Tab.Screen name={routeNames.map} component={LiveMapPage} options={{ title: t('title.map') }} />
      <Tab.Screen name={routeNames.reports} component={ReportsStack} options={{ headerShown: false }} />
      <Tab.Screen name={routeNames.alerts} component={NotificationsPage} options={{ title: t('title.alerts') }} />
    </Tab.Navigator>
  );
}
