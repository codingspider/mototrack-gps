// Login with email or phone number + password. The hash is saved in Keychain by the auth slice.
import React, { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import routeNames from '../../routes/routeNames';
import { clearAuthError, loginUser } from '../../store/slices/authSlice';
import { isBlank } from '../../utils/validators';
import { colors } from '../../theme';
import LoginHero from './components/LoginHero';
import SupportCard from './components/SupportCard';
import styles from './LoginPage.styles';

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const { status, error } = useSelector((state) => state.auth);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [formError, setFormError] = useState('');
  const isLoading = status === 'loading';

  const handleLogin = () => {
    if (isBlank(emailOrPhone) || isBlank(password)) {
      setFormError('Please enter your email or phone and your password');
      return;
    }
    setFormError('');
    dispatch(loginUser({ emailOrPhone: emailOrPhone.trim(), password }));
  };

  const openForgotPassword = () => {
    dispatch(clearAuthError());
    navigation.navigate(routeNames.forgotPassword);
  };

  const message = formError || error;

  return (
    <KeyboardAvoidingView style={styles.safeArea} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <LoginHero />
        <Card style={styles.card}>
          <AppText variant="title" style={styles.title}>
            Welcome Back
          </AppText>

          <AppInput
            placeholder="Email or phone number"
            icon="account-outline"
            value={emailOrPhone}
            onChangeText={setEmailOrPhone}
            keyboardType="email-address"
            autoCorrect={false}
          />
          <AppInput
            placeholder="Password"
            icon="lock-outline"
            rightIcon={isPasswordVisible ? 'eye-outline' : 'eye-off-outline'}
            onRightIconPress={() => setIsPasswordVisible(!isPasswordVisible)}
            value={password}
            onChangeText={setPassword}
            secureTextEntry={!isPasswordVisible}
          />

          <AppButton title="Forgot password?" variant="link" onPress={openForgotPassword} style={styles.forgot} />

          {!!message && (
            <AppText variant="caption" color={colors.secondary} style={styles.errorBox}>
              {message}
            </AppText>
          )}

          <AppButton title="SIGN IN" icon="arrow-right" isIconRight onPress={handleLogin} isLoading={isLoading} />

          <View style={styles.divider}>
            <View style={styles.dividerLine} />
            <AppText variant="caption" color={colors.textSecondary} style={styles.dividerText}>
              or
            </AppText>
            <View style={styles.dividerLine} />
          </View>

          <SupportCard />
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
