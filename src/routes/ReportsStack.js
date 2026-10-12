// The Reports tab: the list of reports, then one report. It is a stack inside the tab, so the bottom bar stays.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { renderBackToHomeButton } from '../components/common/BackToHomeButton';
import ActivityReportPage from '../pages/Reports/ActivityReportPage';
import DailyActivityPage from '../pages/Reports/DailyActivityPage';
import EngineReportPage from '../pages/Reports/EngineReportPage';
import FuelAlertReportPage from '../pages/Reports/FuelAlertReportPage';
import HourlyReportPage from '../pages/Reports/HourlyReportPage';
import LastLocationReportPage from '../pages/Reports/LastLocationReportPage';
import LocationReportPage from '../pages/Reports/LocationReportPage';
import MovementReportPage from '../pages/Reports/MovementReportPage';
import SpeedReportPage from '../pages/Reports/SpeedReportPage';
import TripReportPage from '../pages/Reports/TripReportPage';
import MonthlyOverviewPage from '../pages/Reports/MonthlyOverviewPage';
import ReportPage from '../pages/Reports/ReportPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import { getReportConfig } from '../utils/reportConfigs';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator();

// The daily, monthly, hourly, location, speed, last location, activity, movement, engine, fuel and trip reports have their own pages (laid out like the web reports); the rest use the generic one
function ReportScreen(props) {
  const { type } = props.route.params;
  if (type === 'daily') {
    return <DailyActivityPage {...props} />;
  }
  if (type === 'monthly') {
    return <MonthlyOverviewPage {...props} />;
  }
  if (type === 'hourly') {
    return <HourlyReportPage {...props} />;
  }
  if (type === 'location') {
    return <LocationReportPage {...props} />;
  }
  if (type === 'speed') {
    return <SpeedReportPage {...props} />;
  }
  if (type === 'lastlocation') {
    return <LastLocationReportPage {...props} />;
  }
  if (type === 'activity') {
    return <ActivityReportPage {...props} />;
  }
  if (type === 'movement') {
    return <MovementReportPage {...props} />;
  }
  if (type === 'engine') {
    return <EngineReportPage {...props} />;
  }
  if (type === 'fuel') {
    return <FuelAlertReportPage {...props} />;
  }
  if (type === 'trip') {
    return <TripReportPage {...props} />;
  }
  return <ReportPage {...props} />;
}

export default function ReportsStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name={routeNames.reportsHub} component={ReportsPage} options={{ title: 'Reports', headerLeft: renderBackToHomeButton }} />
      <Stack.Screen
        name={routeNames.reportView}
        component={ReportScreen}
        options={({ route }) => ({ title: getReportConfig(route.params.type).title })}
      />
    </Stack.Navigator>
  );
}
