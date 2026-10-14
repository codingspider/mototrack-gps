// Screens shown before login.
import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import LoginPage from '../pages/Login/LoginPage';
import ForgotPasswordPage from '../pages/ForgotPassword/ForgotPasswordPage';
import routeNames from './routeNames';
import { useAppTheme } from '../theme';
import { useTranslation } from '../i18n/LanguageContext';

const Stack = createNativeStackNavigator();

export default function AuthStack() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <Stack.Navigator
      screenOptions={{
        headerStyle: { backgroundColor: colors.primary },
        headerTintColor: colors.textOnPrimary,
      }}
    >
      <Stack.Screen name={routeNames.login} component={LoginPage} options={{ headerShown: false }} />
      <Stack.Screen
        name={routeNames.forgotPassword}
        component={ForgotPasswordPage}
        options={{ title: t('title.resetPassword') }}
      />
    </Stack.Navigator>
  );
}
