// Bottom tabs for a logged-in customer (custom bar from the design, see AppTabBar).
import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import Icon from 'react-native-vector-icons/MaterialCommunityIcons';
import DashboardPage from '../pages/Dashboard/DashboardPage';
import AccountPage from '../pages/Account/AccountPage';
import PlaceholderPage from '../pages/Placeholder/PlaceholderPage';
import AppTabBar from '../components/common/AppTabBar';
import useSocketConnection from '../hooks/useSocketConnection';
import routeNames from './routeNames';
import { colors } from '../theme';

const Tab = createBottomTabNavigator();

const tabIcons = {
  [routeNames.home]: 'home-outline',
  [routeNames.vehicles]: 'car-outline',
  [routeNames.map]: 'map-marker-outline',
  [routeNames.reports]: 'chart-bar',
  [routeNames.account]: 'account-outline',
};

const tabLabels = {
  [routeNames.home]: 'Home',
  [routeNames.vehicles]: 'Vehicle',
  [routeNames.map]: 'Live',
  [routeNames.reports]: 'Report',
  [routeNames.account]: 'Profile',
};

function renderTabIcon(routeName, color, size) {
  return <Icon name={tabIcons[routeName]} color={color} size={size} />;
}

function renderTabBar(props) {
  return <AppTabBar {...props} />;
}

const MapPage =() => <PlaceholderPage title="Live Map" />;
const VehiclesPage = () => <PlaceholderPage title="Vehicles" />;
const ReportsPage = () => <PlaceholderPage title="Reports" />;

export default function MainTabs() {
  // Starts live tracking as soon as the user is inside the app
  useSocketConnection();

  return (
    <Tab.Navigator
      tabBar={renderTabBar}
      screenOptions={({ route }) => ({
        headerStyle: { backgroundColor: colors.surface },
        headerTintColor: colors.text,
        tabBarLabel: tabLabels[route.name],
        tabBarIcon: ({ color, size }) => renderTabIcon(route.name, color, size),
      })}
    >
      {/* Home draws its own header (logo, alerts, profile) like the design */}
      <Tab.Screen name={routeNames.home} component={DashboardPage} options={{ headerShown: false }} />
      <Tab.Screen name={routeNames.vehicles} component={VehiclesPage} />
      <Tab.Screen name={routeNames.map} component={MapPage} />
      <Tab.Screen name={routeNames.reports} component={ReportsPage} />
      <Tab.Screen name={routeNames.account} component={AccountPage} />
    </Tab.Navigator>
  );
}
