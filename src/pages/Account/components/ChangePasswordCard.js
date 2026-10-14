// "Change password" card on the Profile screen: new password, the same again, and a button.
// The server checks the password rules and explains them when the password is not accepted.
import React, { useState } from 'react';
import { StyleSheet } from 'react-native';
import { useDispatch } from 'react-redux';
import { changePassword } from '../../../api/profileApi';
import AppButton from '../../../components/common/AppButton';
import AppInput from '../../../components/common/AppInput';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { showToast } from '../../../store/slices/toastSlice';
import { validateNewPassword } from '../../../utils/validators';
import { spacing } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

export default function ChangePasswordCard() {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const problem = validateNewPassword(password, confirmation, t);
    if (problem) {
      dispatch(showToast({ type: 'warning', message: problem }));
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(password, confirmation);
      setPassword('');
      setConfirmation('');
      dispatch(showToast({ type: 'success', message: t('password.changed') }));
    } catch (error) {
      dispatch(showToast({ type: 'error', message: error.message }));
    } finally {
      setIsSaving(false);
    }
  };

  const eyeIcon = isVisible ? 'eye-outline' : 'eye-off-outline';

  return (
    <Card style={styles.card}>
      <AppText variant="subtitle" style={styles.title}>
        {t('account.changePassword')}
      </AppText>
      <AppInput
        label={t('password.new')}
        value={password}
        onChangeText={setPassword}
        icon="lock-outline"
        rightIcon={eyeIcon}
        onRightIconPress={() => setIsVisible((current) => !current)}
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppInput
        label={t('password.confirm')}
        value={confirmation}
        onChangeText={setConfirmation}
        icon="lock-check-outline"
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppButton title={t('account.changePassword')} isLoading={isSaving} onPress={handleSave} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.md },
});
