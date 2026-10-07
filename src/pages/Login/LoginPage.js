// Login with email or phone number + password. The hash is saved in Keychain by the auth slice.
import React, { useEffect, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import routeNames from '../../routes/routeNames';
import { clearAuthError, loginUser } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/toastSlice';
import { isBlank } from '../../utils/validators';
import { useAppTheme, useThemedStyles } from '../../theme';
import LoginHero from './components/LoginHero';
import SupportCard from './components/SupportCard';
import makeStyles from './LoginPage.styles';

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { status, error } = useSelector((state) => state.auth);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const isLoading = status === 'loading';

  // Server errors (wrong password, no internet...) show as a red toast
  useEffect(() => {
    if (error) {
      dispatch(showToast({ type: 'error', message: error }));
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const handleLogin = () => {
    if (isBlank(emailOrPhone) || isBlank(password)) {
      dispatch(showToast({ type: 'warning', message: 'Please enter your email or phone and your password' }));
      return;
    }
    dispatch(loginUser({ emailOrPhone: emailOrPhone.trim(), password }));
  };

  const openForgotPassword = () => {
    dispatch(clearAuthError());
    navigation.navigate(routeNames.forgotPassword);
  };

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
