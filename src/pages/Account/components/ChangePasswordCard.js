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

export default function ChangePasswordCard() {
  const dispatch = useDispatch();
  const [password, setPassword] = useState('');
  const [confirmation, setConfirmation] = useState('');
  const [isVisible, setIsVisible] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async () => {
    const problem = validateNewPassword(password, confirmation);
    if (problem) {
      dispatch(showToast({ type: 'warning', message: problem }));
      return;
    }
    setIsSaving(true);
    try {
      await changePassword(password, confirmation);
      setPassword('');
      setConfirmation('');
      dispatch(showToast({ type: 'success', message: 'Your password was changed' }));
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
        Change password
      </AppText>
      <AppInput
        label="New password"
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
        label="Confirm new password"
        value={confirmation}
        onChangeText={setConfirmation}
        icon="lock-check-outline"
        secureTextEntry={!isVisible}
        autoCapitalize="none"
        autoCorrect={false}
      />
      <AppButton title="Change password" isLoading={isSaving} onPress={handleSave} />
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { marginBottom: spacing.lg },
  title: { marginBottom: spacing.md },
});
