// The "Power cut call alert" switch at the top of Alarm settings: power cut alerts ring like a phone call and play the
// recorded message when answered. Geofence calls have their own card (GeofenceCallCard). A phone setting (saved on the
// phone), so it is kept in useState.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Switch } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { useTranslation } from '../../../i18n/LanguageContext';
import { showToast } from '../../../store/slices/toastSlice';
import { selectAllVehicles } from '../../../store/slices/vehiclesSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { buildCallScreenText, getCallAlertMessage } from '../../../utils/callAlert';
import { loadCallAlertEnabled, saveCallAlertEnabled } from '../../../utils/callAlertStorage';
import { openFullScreenAlertSettings, showCallAlert } from '../../../utils/appNotification';
import useFullScreenAlerts from './useFullScreenAlerts';

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
  const canShowFullScreen = useFullScreenAlerts();
  const testVehicle = useSelector(selectAllVehicles)[0]; // the test call shows a real vehicle, like a real alert

  useEffect(() => {
    let isActive = true;
    loadCallAlertEnabled('powerCut').then((value) => isActive && setIsEnabled(value));
    return () => {
      isActive = false;
    };
  }, []);

  const changeEnabled = (value) => {
    setIsEnabled(value);
    saveCallAlertEnabled('powerCut', value);
    dispatch(showToast({ type: 'success', message: value ? t('Call alert is on') : t('Call alert is off') }));
  };

  const testCall = () => {
    const { caller, detail } = buildCallScreenText({
      vehicleName: testVehicle && testVehicle.device_name,
      plate: testVehicle && testVehicle.plate_number,
      alertText: t('Test call: this is how a power cut alert rings'),
    });
    showCallAlert(caller, detail, getCallAlertMessage('powerCut'));
  };

  const color = isEnabled ? colors.primary : colors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
          <Icon source={isEnabled ? 'phone-ring-outline' : 'phone-off-outline'} size={20} color={color} />
        </View>
        <View style={styles.text}>
          <AppText>{t('Power cut call alert')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('Power cut alerts ring like a phone call. Answer it to hear the recorded message.')}
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
