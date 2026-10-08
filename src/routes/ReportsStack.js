// The Reports tab: the list of reports, then one report. It is a stack inside the tab, so the bottom bar stays.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import ReportPage from '../pages/Reports/ReportPage';
import ReportsPage from '../pages/Reports/ReportsPage';
import { getReportConfig } from '../utils/reportConfigs';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';

const Stack = createNativeStackNavigator();

export default function ReportsStack() {
  const { colors } = useAppTheme();

  return (
    <Stack.Navigator screenOptions={{ headerTintColor: colors.text, headerStyle: { backgroundColor: colors.surface } }}>
      <Stack.Screen name={routeNames.reportsHub} component={ReportsPage} options={{ title: 'Reports' }} />
      <Stack.Screen
        name={routeNames.reportView}
        component={ReportPage}
        options={({ route }) => ({ title: getReportConfig(route.params.type).title })}
      />
    </Stack.Navigator>
  );
}
