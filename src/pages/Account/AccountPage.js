// Profile screen: who is logged in, then a menu with Alerts, Alarm settings, Dark mode, Change password, Terms,
// Privacy policy, Rate this app, the app version and Delete my account.
// (The Home header only has the profile button; everything else is reached from here.)
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { version as appVersion } from '../../../package.json';
import Card from '../../components/common/Card';
import routeNames from '../../routes/routeNames';
import { logoutUser } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/toastSlice';
import { openPlayStoreRating } from '../../utils/rateApp';
import { fetchProfile, selectProfile } from '../../store/slices/profileSlice';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import ChangePasswordCard from './components/ChangePasswordCard';
import DeleteAccountModal from './components/DeleteAccountModal';
import MenuRow from './components/MenuRow';
import ProfileHeader from './components/ProfileHeader';
import { useTranslation } from '../../i18n/LanguageContext';
import useVehicleIconSize from '../../hooks/useVehicleIconSize';

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
  const { t, language, toggleLanguage } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { sizeKey: iconSizeKey, nextSize: nextIconSize } = useVehicleIconSize();
  const profile = useSelector(selectProfile);
  const [isPasswordOpen, setIsPasswordOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Loads only if missing or stale (Home already asked for it)
  useEffect(() => {
    dispatch(fetchProfile());
  }, [dispatch]);

  // Alerts is a bottom tab, so open it through the tabs screen
  const openAlerts = () => navigation.navigate(routeNames.mainTabs, { screen: routeNames.alerts });

  // Terms and privacy open inside the app (a web view of the portal's own page)
  const openLegal = (slug, title) => navigation.navigate(routeNames.legal, { slug, title });

  // The Play Store page of the app: the customer taps the stars there and the rating is published
  const rateApp = async () => {
    const isOpened = await openPlayStoreRating();
    if (!isOpened) {
      dispatch(showToast({ type: 'warning', message: t('account.playStoreFailed') }));
    }
  };

  return (
    <KeyboardAvoidingView style={styles.screen}>
      <ScrollView keyboardShouldPersistTaps="handled">
        <ProfileHeader profile={profile} onBack={() => navigation.goBack()} onLogout={() => dispatch(logoutUser())} />
        <View style={styles.content}>
          <Card style={styles.menu}>
            <MenuRow icon="bell-outline" title={t('account.alerts')} subtitle={t('account.alertsSub')} onPress={openAlerts} />
            <View style={styles.divider} />
            <MenuRow
              icon="bell-ring-outline"
              title={t('account.alarmSettings')}
              subtitle={t('account.alarmSettingsSub')}
              onPress={() => navigation.navigate(routeNames.alarmSettings)}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="certificate-outline"
              title={t('account.certificates')}
              subtitle={t('account.certificatesSub')}
              onPress={() => navigation.navigate(routeNames.certificates)}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="shield-check-outline"
              title={t('account.warranty')}
              subtitle={t('account.warrantySub')}
              onPress={() => navigation.navigate(routeNames.warranty)}
            />
            <View style={styles.divider} />
            <MenuRow
              icon={isDark ? 'weather-night' : 'white-balance-sunny'}
              title={t('account.darkMode')}
              subtitle={isDark ? t('common.on') : t('common.off')}
              isOn={isDark}
              onToggle={toggleTheme}
            />
            <View style={styles.divider} />
            {/* Shows the language you are using; tap to switch (the choice is remembered) */}
            <MenuRow
              icon="translate"
              title={t('account.language')}
              rightText={language === 'en' ? 'English' : 'বাংলা'}
              onPress={toggleLanguage}
            />
            <View style={styles.divider} />
            {/* Tap to go to the next size; the vehicle details map reads the saved choice */}
            <MenuRow
              icon="car-cog"
              title={t('account.iconSize')}
              subtitle={t('account.iconSizeSub')}
              rightText={t(`account.iconSize.${iconSizeKey}`)}
              onPress={nextIconSize}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="lock-outline"
              title={t('account.changePassword')}
              onPress={() => setIsPasswordOpen((current) => !current)}
              chevronIcon={isPasswordOpen ? 'chevron-down' : 'chevron-right'}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="file-document-outline"
              title={t('account.terms')}
              onPress={() => openLegal('terms_conditions', t('account.terms'))}
            />
            <View style={styles.divider} />
            <MenuRow
              icon="shield-lock-outline"
              title={t('account.privacy')}
              onPress={() => openLegal('privacy_policy', t('account.privacy'))}
            />
            <View style={styles.divider} />
            <MenuRow icon="star-outline" title={t('account.rate')} subtitle={t('account.rateSub')} onPress={rateApp} />
            <View style={styles.divider} />
            <MenuRow icon="information-outline" title={t('account.version')} rightText={appVersion} />
            <View style={styles.divider} />
            <MenuRow
              icon="account-remove-outline"
              title={t('account.deleteAccount')}
              subtitle={t('account.deleteAccountSub')}
              isDanger
              onPress={() => setIsDeleteOpen(true)}
            />
          </Card>
          {isPasswordOpen && <ChangePasswordCard />}
        </View>
      </ScrollView>
      <DeleteAccountModal visible={isDeleteOpen} onDismiss={() => setIsDeleteOpen(false)} />
    </KeyboardAvoidingView>
  );
}
