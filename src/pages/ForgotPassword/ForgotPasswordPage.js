// Password reset by SMS code: step 1 phone number, step 2 code + new password.
import React, { useState } from 'react';
import { Alert, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import AppText from '../../components/common/AppText';
import PhoneStep from './components/PhoneStep';
import ResetStep from './components/ResetStep';
import { requestPasswordCode, resetPassword } from '../../api/authApi';
import { colors } from '../../theme';
import styles from './ForgotPasswordPage.styles';

export default function ForgotPasswordPage({ navigation }) {
  const [phone, setPhone] = useState('');
  const [step, setStep] = useState('phone'); // 'phone' | 'reset'
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const sendCode = async (phoneNumber) => {
    setIsLoading(true);
    setError('');
    try {
      await requestPasswordCode(phoneNumber);
      setPhone(phoneNumber);
      setStep('reset');
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  };

  const changePassword = async (code, password) => {
    setIsLoading(true);
    setError('');
    try {
      await resetPassword(phone, code, password);
      Alert.alert('Password changed', 'You can now log in with your new password.');
      navigation.goBack();
    } catch (requestError) {
      setError(requestError.message);
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

        {!!error && (
          <AppText variant="caption" color={colors.secondary} style={styles.errorText}>
            {error}
          </AppText>
        )}

        {step === 'phone' ? (
          <PhoneStep onSubmit={sendCode} isLoading={isLoading} />
        ) : (
          <ResetStep onSubmit={changePassword} onResend={() => sendCode(phone)} isLoading={isLoading} />
        )}
      </ScrollView>
    </SafeAreaView>
  );
}