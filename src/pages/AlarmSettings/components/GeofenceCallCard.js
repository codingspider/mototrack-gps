// The "Geofence call alert" card of Alarm settings: a vehicle entering and / or leaving a geofence rings like a phone
// call, each with its own recorded message (geofence_in_alert_message / geofence_out_alert_message). Two switches,
// saved on the phone like the power cut one.
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

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { marginBottom: spacing.md, padding: spacing.md, gap: spacing.sm },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: { width: 38, height: 38, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    text: { flex: 1 },
    switchRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      paddingTop: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    buttonRow: { flexDirection: 'row', gap: spacing.sm },
    button: { flex: 1 },
  });

export default function GeofenceCallCard() {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const [isInEnabled, setIsInEnabled] = useState(true);
  const [isOutEnabled, setIsOutEnabled] = useState(true);
  const canShowFullScreen = useFullScreenAlerts();
  const testVehicle = useSelector(selectAllVehicles)[0]; // the test call shows a real vehicle, like a real alert

  useEffect(() => {
    let isActive = true;
    loadCallAlertEnabled('geofenceIn').then((value) => isActive && setIsInEnabled(value));
    loadCallAlertEnabled('geofenceOut').then((value) => isActive && setIsOutEnabled(value));
    return () => {
      isActive = false;
    };
  }, []);

  const change = (reason, value) => {
    if (reason === 'geofenceIn') {
      setIsInEnabled(value);
    } else {
      setIsOutEnabled(value);
    }
    saveCallAlertEnabled(reason, value);
    dispatch(showToast({ type: 'success', message: value ? t('Call alert is on') : t('Call alert is off') }));
  };

  const testCall = (reason) => {
    const { caller, detail } = buildCallScreenText({
      vehicleName: testVehicle && testVehicle.device_name,
      plate: testVehicle && testVehicle.plate_number,
      alertText:
        reason === 'geofenceIn'
          ? t('Test call: this is how a geofence enter alert rings')
          : t('Test call: this is how a geofence leave alert rings'),
    });
    showCallAlert(caller, detail, getCallAlertMessage(reason));
  };

  const isAnyEnabled = isInEnabled || isOutEnabled;
  const color = isAnyEnabled ? colors.primary : colors.textSecondary;

  return (
    <Card style={styles.card}>
      <View style={styles.row}>
        <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
          <Icon source={isAnyEnabled ? 'map-marker-radius-outline' : 'map-marker-off-outline'} size={20} color={color} />
        </View>
        <View style={styles.text}>
          <AppText>{t('Geofence call alert')}</AppText>
          <AppText variant="caption" color={colors.textSecondary}>
            {t('Geofence alerts ring like a phone call, with their own recorded message for entering and leaving.')}
          </AppText>
        </View>
      </View>
      <View style={styles.switchRow}>
        <Icon source="location-enter" size={20} color={isInEnabled ? colors.primary : colors.textSecondary} />
        <AppText style={styles.text}>{t('When a vehicle enters a geofence')}</AppText>
        <Switch value={isInEnabled} onValueChange={(value) => change('geofenceIn', value)} color={colors.primary} />
      </View>
      <View style={styles.switchRow}>
        <Icon source="location-exit" size={20} color={isOutEnabled ? colors.primary : colors.textSecondary} />
        <AppText style={styles.text}>{t('When a vehicle leaves a geofence')}</AppText>
        <Switch value={isOutEnabled} onValueChange={(value) => change('geofenceOut', value)} color={colors.primary} />
      </View>
      {isAnyEnabled && !canShowFullScreen && (
        <>
          <AppText variant="caption" color={colors.warning}>
            {t('Allow full screen alerts so the call also shows when the phone is locked.')}
          </AppText>
          <AppButton title={t('Allow')} icon="cellphone-lock" isCompact onPress={openFullScreenAlertSettings} />
        </>
      )}
      {isAnyEnabled && (
        <View style={styles.buttonRow}>
          {isInEnabled && (
            <AppButton
              title={t('Test enter')}
              icon="phone-in-talk-outline"
              isCompact
              variant="secondary"
              onPress={() => testCall('geofenceIn')}
              style={styles.button}
            />
          )}
          {isOutEnabled && (
            <AppButton
              title={t('Test leave')}
              icon="phone-in-talk-outline"
              isCompact
              variant="secondary"
              onPress={() => testCall('geofenceOut')}
              style={styles.button}
            />
          )}
        </View>
      )}
    </Card>
  );
}
