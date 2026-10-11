// Profile screen: who is logged in, then a menu with Alerts, Dark mode, Change password and the app version.
// (The Home header only has the profile button; everything else is reached from here.)
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { version as appVersion } from '../../../package.json';
import Card from '../../components/common/Card';
import routeNames from '../../routes/routeNames';
import { logoutUser } from '../../store/slices/authSlice';
import { fetchProfile, selectProfile } from '../../store/slices/profileSlice';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import ChangePasswordCard from './components/ChangePasswordCard';
import MenuRow from './components/MenuRow';
import ProfileHeader from './components/ProfileHeader';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
    menu: { padding: 0, overflow: 'hidden' },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginLeft: spacing.md + 38 + spacing.md },
  });

export default function AccountPage({ navigation }) {
  const dispatch = useDispatch();
  const { isDark, toggleTheme } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const profile = useSelector(selectProfile);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);

  // Loads only if missing or stale (Home already asked for it)
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Alerts is a bottom tab, so open it through the tabs screen
  const openAlerts = () => navigation.navigate(routeNames.mainTabs, { screen: routeNames.alerts });

  return (
    <KeyboardAvoidingView style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ProfileHeader profile={profile} onBack={() => navigation.goBack()} onLogout={() => dispatch(logoutUser())} />
        <View style={styles.content}>
          <Card style={styles.menu}>
            <MenuRow icon="bell-outline" title="Alerts" subtitle="Overspeed, geofence, ignition and more" onPress={openAlerts} />
            <View style={styles.divider} />
            <MenuRow
              icon={isDark ? 'weather-night' : 'white-balance-sunny'}
              title="Dark mode"
              subtitle={isDark ? 'On' : 'Off'}
              isOn={isDark}
              onToggle={toggleTheme}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="lock-outline"
              title="Change password"
              onPress={() => setIsPasswordOpen((current) => !current)}
              chevronIcon={isPasswordOpen ? 'chevron-down' : 'chevron-right'}
            />
            <View style={styles.divider} />
            <MenuRow icon="information-outline" title="App version" rightText={appVersion} />
          </Card>
          {isPasswordOpen && <ChangePasswordCard />}
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
