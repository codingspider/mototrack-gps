// "Delete my account" pop up: says what will happen, asks for the password, then deletes through the server.
// The server soft deletes the account (the customer can no longer log in); the app then logs out.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Modal, Portal } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import AppText from '../../../components/common/AppText';
import { deleteMyAccount } from '../../../store/slices/authSlice';
import { showToast } from '../../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.lg, padding: spacing.lg, gap: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface },
    header: { alignItems: 'center', gap: spacing.sm },
    center: { textAlign: 'center' },
    actions: { gap: spacing.sm },
  });

/**
 * @param {boolean} visible
 * @param {function} onDismiss
 */
export default function DeleteAccountModal({ visible, onDismiss }) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [password, setPassword] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // A fresh form every time it opens
  useEffect(() => {
    if (visible) {
      setPassword('');
      setIsVisible(false);
    }
  }, [visible]);

  const handleDelete = async () => {
    if (!password.trim()) {
      dispatch(showToast({ type: 'warning', message: t('delete.enterPassword') }));
      return;
    }
    setIsDeleting(true);
    const result = await dispatch(deleteMyAccount({ password, reason: '' }));
    if (deleteMyAccount.rejected.match(result)) {
      setIsDeleting(false);
      dispatch(showToast({ type: 'error', message: result.payload || t('delete.failed') }));
    }
    // On success the app logs out and this screen goes away
  };

  return (
    <Portal>
      <Modal visible={visible} onDismiss={isDeleting ? undefined : onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <Icon source="alert-circle-outline" size={48} color={colors.secondary} />
          <AppText variant="subtitle">{t('delete.title')}</AppText>
        </View>
        <AppText color={colors.textSecondary} style={styles.center}>
          {t('delete.body')}
        </AppText>
        <AppInput
          label={t('delete.password')}
          value={password}
          onChangeText={setPassword}
          icon="lock-outline"
          rightIcon={isVisible ? 'eye-outline' : 'eye-off-outline'}
          onRightIconPress={() => setIsVisible((current) => !current)}
          secureTextEntry={!isVisible}
          autoCapitalize="none"
          autoCorrect={false}
        />
        <View style={styles.actions}>
          <AppButton title={t('delete.confirm')} variant="secondary" isLoading={isDeleting} onPress={handleDelete} />
          <AppButton title={t('common.cancel')} variant="link" isDisabled={isDeleting} onPress={onDismiss} />
        </View>
      </Modal>
    </Portal>
  );
}
