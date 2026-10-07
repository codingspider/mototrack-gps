// Password reset by SMS code: step 1 phone number, step 2 code + new password.
import React, { useState } from 'react';
import { ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useDispatch } from 'react-redux';
import AppText from '../../components/common/AppText';
import PhoneStep from './components/PhoneStep';
import ResetStep from './components/ResetStep';
import { requestPasswordCode, resetPassword } from '../../api/authApi';
import { showToast } from '../../store/slices/toastSlice';
import { useAppTheme, useThemedStyles } from '../../theme';
import makeStyles from './ForgotPasswordPage.styles';

export default function ForgotPasswordPage({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'reset'
  const [isLoading, setIsLoading] = useState(false);

  const sendCode = async (phoneNumber) => {
    setIsLoading(true);
    try {
      await requestPasswordCode(phoneNumber);
      setPhone(phoneNumber);
      setStep('reset');
      dispatch(showToast({ type: 'success', message: 'Code sent. Check your SMS.' }));
    } catch (requestError) {
      dispatch(showToast({ type: 'error', message: requestError.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (code, password) => {
    setIsLoading(true);
    try {
      await resetPassword(phone, code, password);
      dispatch(showToast({ type: 'success', message: 'Password changed. You can now log in.' }));
      navigation.goBack();
    } catch (requestError) {
      dispatch(showToast({ type: 'error', message: requestError.message }));
    } finally {
      setIsLoading(false);
    }
  };

  const introText =
    step === 'phone'
      ? 'Enter your mobile number. We will send you a 6 digit code by SMS.'
      : `We sent a code to ${phone}. Enter it below with your new password.`;

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <AppText color={colors.textSecondary} style={styles.intro}>
          {introText}
        </AppText>

        {step === 'phone' ? (
          <PhoneStep onSubmit={sendCode} isLoading={isLoading} />
        ) : (
          <ResetStep onSubmit={changePassword} onResend={() => sendCode(phone)} isLoading={isLoading} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}