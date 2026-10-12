// Share pop up: pick how long the live link works (1 to 12 hours), then send it with the phone's share menu.
// Shows the link that is already live (with Stop sharing) when there is one.
import React, { useEffect, useState } from 'react';
import { Share, StyleSheet, View } from 'react-native';
import { Icon, IconButton, Modal, Portal, TouchableRipple } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import { createShareLink, fetchShare, selectShare, stopShare } from '../../../store/slices/shareSlice';
import { showToast } from '../../../store/slices/toastSlice';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { buildShareLinkMessage, SHARE_HOURS } from '../../../utils/vehicleActions';
import { formatBdDateTime } from '../../../utils/formatDate';

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.lg, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    center: { textAlign: 'center' },
    state: { alignItems: 'center', gap: spacing.xs },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, justifyContent: 'center' },
    chip: {
      minWidth: 64,
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: radius.round,
      borderWidth: 1,
      borderColor: colors.border,
      alignItems: 'center',
    },
    chipSelected: { borderColor: colors.primary, backgroundColor: colors.primarySoft },
    actions: { gap: spacing.sm },
  });

/**
 * @param {boolean} visible
 * @param {function} onDismiss
 * @param {number} vehicleId The vehicle is read from Redux
 */
export default function ShareLocationModal({ visible, onDismiss, vehicleId }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const { isShared, url, expiresAt, isSaving } = useSelector(selectShare(vehicleId));
  const [hours, setHours] = useState(SHARE_HOURS[0]);

  // Read the live link each time the pop up opens (it may have been made on another phone or expired)
  useEffect(() => {
    if (visible) {
      dispatch(fetchShare({ deviceId: vehicleId }));
    }
  }, [dispatch, visible, vehicleId]);

  if (!vehicle) {
    return null;
  }

  const openShareMenu = async (shareUrl, shareExpiresAt) => {
    try {
      await Share.share({ message: buildShareLinkMessage(vehicle, shareUrl, shareExpiresAt) });
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
  };

  const createAndShare = async () => {
    const result = await dispatch(createShareLink({ deviceId: vehicleId, hours }));
    if (createShareLink.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: (result.payload && result.payload.message) || 'Could not create the link' }));
      return;
    }
    await openShareMenu(result.payload.url, result.payload.expiresAt);
  };

  const stop = async () => {
    const result = await dispatch(stopShare({ deviceId: vehicleId }));
    if (stopShare.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: (result.payload && result.payload.message) || 'Could not stop sharing' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: 'Sharing stopped. The link no longer works.' }));
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={isSaving ? undefined : onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <AppText variant="subtitle">Share live location</AppText>
          <IconButton icon="close" size={20} disabled={isSaving} onPress={onDismiss} accessibilityLabel="Close" />
        </View>

        {isShared && (
          <View style={styles.state}>
            <Icon source="share-variant" size={36} color={colors.statusOnline} />
            <AppText style={styles.center}>{`Live link is on until ${formatBdDateTime(expiresAt)}`}</AppText>
            <AppButton title="Send this link again" variant="link" isDisabled={isSaving} onPress={() => openShareMenu(url, expiresAt)} />
          </View>
        )}

        <AppText color={colors.textSecondary} style={styles.center}>
          {isShared ? 'Make a new link (the old one stops working):' : 'Anyone with the link can see where this vehicle is, until it expires.'}
        </AppText>
        <AppText style={styles.center}>Link valid for</AppText>
        <View style={styles.chips}>
          {SHARE_HOURS.map((value) => (
            <TouchableRipple
              key={value}
              borderless
              style={[styles.chip, value === hours && styles.chipSelected]}
              onPress={() => setHours(value)}
              disabled={isSaving}
            >
              <AppText color={value === hours ? colors.primary : colors.text}>{`${value} ${value === 1 ? 'hour' : 'hours'}`}</AppText>
            </TouchableRipple>
          ))}
        </View>

        <View style={styles.actions}>
          <AppButton title={`Share for ${hours} ${hours === 1 ? 'hour' : 'hours'}`} icon="share-variant" isLoading={isSaving} onPress={createAndShare} />
          {isShared && <AppButton title="Stop sharing" variant="secondary" isDisabled={isSaving} onPress={stop} />}
        </View>
      </Modal>
    </Portal>
  );
}
