// Pop up on the details page when the vehicle's service has ended or ends soon, with a Recharge now button.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Dialog, Icon, Portal } from 'react-native-paper';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme } from '../../../theme';

/**
 * @param {boolean} visible
 * @param {{ level: 'expired'|'soon', title: string, message: string }|null} notice From getRenewalNotice
 * @param {string} vehicleName
 * @param {function} onRecharge
 * @param {function} onDismiss "Later" or tapping outside
 */
export default function RenewalDialog({ visible, notice, vehicleName, onRecharge, onDismiss }) {
  const { colors } = useAppTheme();
  if (!notice) {
    return null;
  }
  const isExpired = notice.level === 'expired';
  const color = isExpired ? colors.secondary : colors.accent;

  return (
    <Portal>
      <Dialog visible={visible} onDismiss={onDismiss} style={styles.dialog}>
        <Dialog.Content>
          <View style={styles.center}>
            <Icon source={isExpired ? 'alert-circle-outline' : 'clock-alert-outline'} size={56} color={color} />
            <AppText variant="subtitle" style={styles.title}>
              {notice.title}
            </AppText>
            <AppText style={styles.name}>{vehicleName}</AppText>
            <AppText color={colors.textSecondary} style={styles.message}>
              {notice.message}
            </AppText>
          </View>
        </Dialog.Content>
        <Dialog.Actions>
          <AppButton title="Later" variant="link" onPress={onDismiss} />
          <AppButton title="Recharge now" variant="secondary" onPress={onRecharge} />
        </Dialog.Actions>
      </Dialog>
    </Portal>
  );
}

const styles = StyleSheet.create({
  // Paper's dialog is very round by default; use the same corner as the app's cards
  dialog: { borderRadius: radius.md },
  center: { alignItems: 'center', gap: spacing.xs },
  title: { marginTop: spacing.sm, textAlign: 'center' },
  name: { fontWeight: '700', textAlign: 'center' },
  message: { textAlign: 'center', marginTop: spacing.xs },
});
