// The "Incoming call alert" switch at the top of Alarm settings: power cut and geofence out alerts ring like a phone
// call and play a recorded message when answered. A phone setting (saved on the phone), so it is kept in useState.
import React, { useCallback, useEffect, useState } from 'react';
import { AppState, StyleSheet, View } from 'react-native';
import { Icon, Switch } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { useTranslation } from '../../../i18n/LanguageContext';
import { showToast } from '../../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { CALL_ALERT_CALLER } from '../../../utils/callAlert';
import { loadCallAlertEnabled, saveCallAlertEnabled } from '../../../utils/callAlertStorage';
import { canUseFullScreenAlerts, openFullScreenAlertSettings, showCallAlert } from '../../../utils/appNotification';

const makeStyles = () =>
  StyleSheet.create({
    card: { marginBottom: spacing.md, padding: spacing.md, gap: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 38, height: 38, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    buttonRow: { flexDirection: 'row', gap: spacing.sm },
    button: { flex: 1 },
  });

export default function CallAlertCard() {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [isEnabled, setIsEnabled] = useState(true);
  const [canShowFullScreen, setCanShowFullScreen] = useState(true);

  const checkFullScreen = useCallback(async () => {
    setCanShowFullScreen(await canUseFullScreenAlerts());
  }, []);

  useEffect(() => {
    let isActive = true;
    loadCallAlertEnabled().then((value) => isActive && setIsEnabled(value));
    checkFullScreen();
    // Back from the phone settings: read the permission again
    const subscription = AppState.addEventListener('change', (state) => {
      if (state === 'active') {
        checkFullScreen();
      }
    });
    return () => {
      isActive = false;
      subscription.remove();
    };
  }, [checkFullScreen]);

  const changeEnabled = (value) => {
    setIsEnabled(value);
    saveCallAlertEnabled(value);
    dispatch(showToast({ type: 'success', message: value ? t('Call alert is on') : t('Call alert is off') }));
  };

  const testCall = () => showCallAlert(CALL_ALERT_CALLER, t('Test call: this is how a power cut alert rings'));

  const color = isEnabled ? colors.primary : colors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
          <Icon source={isEnabled ? 'phone-ring-outline' : 'phone-off-outline'} size={20} color={color} />
        </View>
        <View style={styles.text}>
          <AppText>{t('Incoming call alert')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('Power cut and geofence out alerts ring like a phone call. Answer it to hear the recorded message.')}
          </AppText>
        </View>
        <Switch value={isEnabled} onValueChange={changeEnabled} color={colors.primary} />
      </View>
      {isEnabled && !canShowFullScreen && (
        <AppText variant="caption" color={colors.warning}>
          {t('Allow full screen alerts so the call also shows when the phone is locked.')}
        </AppText>
      )}
      {isEnabled && (
        <View style={styles.buttonRow}>
          {!canShowFullScreen && (
            <AppButton
              title={t('Allow')}
              icon="cellphone-lock"
              isCompact
              onPress={openFullScreenAlertSettings}
              style={styles.button}
            />
          )}
          <AppButton
            title={t('Test call')}
            icon="phone-in-talk-outline"
            isCompact
            variant="secondary"
            onPress={testCall}
            style={styles.button}
          />
        </View>
      )}
    </Card>
  );
}
