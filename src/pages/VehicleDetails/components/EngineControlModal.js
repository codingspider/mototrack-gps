// Engine control pop up: shows whether the engine is cut off, and lets the customer stop or resume it.
// Every command asks for a confirmation first, with a stronger warning when the vehicle is moving.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, IconButton, Modal, Portal } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import { selectSendingDeviceId, sendEngineCommand } from '../../../store/slices/commandsSlice';
import { showToast } from '../../../store/slices/toastSlice';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const MOVING_SPEED_KMH = 5; // faster than this counts as moving

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.lg, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    state: { alignItems: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    warning: { color: colors.secondary, fontWeight: '700', textAlign: 'center' },
    center: { textAlign: 'center' },
    actions: { gap: spacing.sm },
  });

const COPY = {
  stop: {
    title: 'Stop engine?',
    confirm: 'Yes, stop engine',
    text: 'The vehicle will be switched off and cannot be started until you resume it.',
  },
  resume: {
    title: 'Resume engine?',
    confirm: 'Yes, resume engine',
    text: 'The vehicle will be able to start again.',
  },
};

/**
 * @param {boolean} visible
 * @param {function} onDismiss
 * @param {number} vehicleId The vehicle is read from Redux
 */
export default function EngineControlModal({ visible, onDismiss, vehicleId }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const sendingDeviceId = useSelector(selectSendingDeviceId);
  const [pendingAction, setPendingAction] = useState(null); // 'stop' | 'resume' while the confirmation shows

  useEffect(() => {
    if (!visible) {
      setPendingAction(null);
    }
  }, [visible]);

  if (!vehicle) {
    return null;
  }
  const isBlocked = !!(vehicle.details?.engine_blocked ?? vehicle.engine_blocked);
  const speed = Math.round(Number(vehicle.live_speed) || 0);
  const isMoving = speed > MOVING_SPEED_KMH;
  const isSending = sendingDeviceId === vehicleId;

  const send = async () => {
    const action = pendingAction;
    const result = await dispatch(sendEngineCommand({ deviceId: vehicleId, action }));
    if (sendEngineCommand.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'The command could not be sent' }));
      return;
    }
    dispatch(
      showToast({
        type: 'success',
        message: action === 'stop' ? 'Stop command sent. The engine will be cut off shortly.' : 'Resume command sent. The engine will be restored shortly.',
      }),
    );
    setPendingAction(null);
    onDismiss();
  };

  const renderConfirm = () => (
    <>
      <View style={styles.state}>
        <Icon source="alert-circle-outline" size={48} color={colors.secondary} />
        <AppText variant="subtitle">{COPY[pendingAction].title}</AppText>
        <AppText style={styles.center}>{`${vehicle.device_name}`}</AppText>
        <AppText color={colors.textSecondary} style={styles.center}>
          {COPY[pendingAction].text}
        </AppText>
        {pendingAction === 'stop' && isMoving && (
          <AppText style={styles.warning}>
            {`This vehicle is moving at ${speed} km/h. Stopping the engine while it moves can be dangerous.`}
          </AppText>
        )}
      </View>
      <View style={styles.actions}>
        <AppButton
          title={COPY[pendingAction].confirm}
          variant={pendingAction === 'stop' ? 'secondary' : 'primary'}
          isLoading={isSending}
          onPress={send}
        />
        <AppButton title="Cancel" variant="link" isDisabled={isSending} onPress={() => setPendingAction(null)} />
      </View>
    </>
  );

  const renderChoices = () => (
    <>
      <View style={styles.state}>
        <Icon source={isBlocked ? 'engine-off' : 'engine'} size={48} color={isBlocked ? colors.secondary : colors.statusOnline} />
        <AppText variant="subtitle">{isBlocked ? 'Engine is stopped' : 'Engine can run'}</AppText>
        <AppText color={colors.textSecondary} style={styles.center}>
          {isBlocked ? 'The engine is cut off. Resume it to let the vehicle start.' : 'The engine is not cut off.'}
        </AppText>
      </View>
      <View style={styles.actions}>
        <AppButton title="Stop engine" variant="secondary" icon="power" onPress={() => setPendingAction('stop')} />
        <AppButton title="Resume engine" icon="play" onPress={() => setPendingAction('resume')} />
      </View>
    </>
  );

  return (
    <Portal>
      <Modal visible={visible} onDismiss={isSending ? undefined : onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <AppText variant="subtitle">Engine control</AppText>
          <IconButton icon="close" size={20} disabled={isSending} onPress={onDismiss} accessibilityLabel="Close" />
        </View>
        {pendingAction ? renderConfirm() : renderChoices()}
      </Modal>
    </Portal>
  );
}
