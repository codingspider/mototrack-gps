// Login with email or phone number + password. The hash is saved in Keychain by the auth slice.
// "Remember me" keeps the email / phone and password in Keychain so they are filled in next time.
// The two inputs are scrolled into view above the keyboard, so they stay visible while typing.
import React, { useEffect, useRef, useState } from 'react';
import {
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
} from 'react-native';
import { Checkbox, TouchableRipple } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppLogo from '../../components/common/AppLogo';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import routeNames from '../../routes/routeNames';
import { clearAuthError, loginUser } from '../../store/slices/authSlice';
import { showToast } from '../../store/slices/toastSlice';
import {
  clearRememberedLogin,
  loadRememberedLogin,
  saveRememberedLogin,
} from '../../utils/secureStorage';
import { isBlank } from '../../utils/validators';
import { useAppTheme, useThemedStyles } from '../../theme';
import { useTranslation } from '../../i18n/LanguageContext';
import LoginHero from './components/LoginHero';
import LoginToolbar from './components/LoginToolbar';
import SupportCard from './components/SupportCard';
import makeStyles from './LoginPage.styles';

const LOGO_HEIGHT = 56;
const INPUTS_TOP_GAP = 120; // space kept above the inputs when they are scrolled up (the title stays visible)

export default function LoginPage({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const { t } = useTranslation();
  const { status, error } = useSelector(state => state.auth);
  const [emailOrPhone, setEmailOrPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isPasswordVisible, setIsPasswordVisible] = useState(false);
  const [isRemembered, setIsRemembered] = useState(false);
  const [keyboardHeight, setKeyboardHeight] = useState(0);
  const scrollRef = useRef(null);
  const cardTop = useRef(0); // where the card starts inside the scroll view
  const inputsTop = useRef(0); // where the two inputs start inside the card
  const isLoading = status === 'loading';

  // Fill in the login the customer asked us to remember
  useEffect(() => {
    let isActive = true;
    loadRememberedLogin()
      .then(saved => {
        if (isActive && saved) {
          setEmailOrPhone(saved.emailOrPhone);
          setPassword(saved.password);
          setIsRemembered(true);
        }
      })
      .catch(() => {});
    return () => {
      isActive = false;
    };
  }, []);

  // Keep the inputs above the keyboard: add room under the form and scroll them up
  useEffect(() => {
    const showSub = Keyboard.addListener('keyboardDidShow', event => {
      setKeyboardHeight(event.endCoordinates.height);
      setTimeout(() => {
        scrollRef.current?.scrollTo({
          y: Math.max(0, cardTop.current + inputsTop.current - INPUTS_TOP_GAP),
          animated: true,
        });
      }, 50);
    });
    const hideSub = Keyboard.addListener('keyboardDidHide', () =>
      setKeyboardHeight(0),
    );
    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, []);

  // Server errors (wrong password, no internet...) show as a red toast
  useEffect(() => {
    if (error) {
      dispatch(showToast({ type: 'error', message: error }));
      dispatch(clearAuthError());
    }
  }, [error, dispatch]);

  const handleLogin = async () => {
    if (isBlank(emailOrPhone) || isBlank(password)) {
      dispatch(
        showToast({
          type: 'warning',
          message: t('login.enterBoth'),
        }),
      );
      return;
    }
    const identifier = emailOrPhone.trim();
    const result = await dispatch(
      loginUser({ emailOrPhone: identifier, password }),
    );
    if (!loginUser.fulfilled.match(result)) {
      return;
    }
    // Only after a successful login: keep the login, or forget the one kept before
    try {
      if (isRemembered) {
        await saveRememberedLogin(identifier, password);
      } else {
        await clearRememberedLogin();
      }
    } catch (saveError) {
      // Not being able to remember must never block the login
    }
  };

  const openForgotPassword = () => {
    dispatch(clearAuthError());
    navigation.navigate(routeNames.forgotPassword);
  };

  return (
    <KeyboardAvoidingView
      style={styles.safeArea}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView
        ref={scrollRef}
        contentContainerStyle={[
          styles.content,
          { paddingBottom: keyboardHeight },
        ]}
        keyboardShouldPersistTaps="handled"
      >
        <LoginHero />
        <View
          onLayout={event => (cardTop.current = event.nativeEvent.layout.y)}
        >
          <Card style={styles.card}>
            <View style={styles.logo}>
              <AppLogo height={LOGO_HEIGHT} />
            </View>
            <AppText variant="title" style={styles.title}>
              {t('login.welcome')}
            </AppText>

            <View
              onLayout={event =>
                (inputsTop.current = event.nativeEvent.layout.y)
              }
            >
              <AppInput
                placeholder={t('login.emailOrPhone')}
                icon="account-outline"
                value={emailOrPhone}
                onChangeText={setEmailOrPhone}
                keyboardType="email-address"
                autoCorrect={false}
              />
              <AppInput
                placeholder={t('login.password')}
                icon="lock-outline"
                rightIcon={
                  isPasswordVisible ? 'eye-outline' : 'eye-off-outline'
                }
                onRightIconPress={() =>
                  setIsPasswordVisible(!isPasswordVisible)
                }
                value={password}
                onChangeText={setPassword}
                secureTextEntry={!isPasswordVisible}
              />
            </View>

            <View style={styles.options}>
              <TouchableRipple
                borderless
                style={styles.remember}
                onPress={() => setIsRemembered(!isRemembered)}
              >
                <View style={styles.rememberContent}>
                  <Checkbox
                    status={isRemembered ? 'checked' : 'unchecked'}
                    color={colors.primary}
                  />
                  <AppText>{t('login.rememberMe')}</AppText>
                </View>
              </TouchableRipple>
              <AppButton
                title={t('login.forgotPassword')}
                variant="link"
                onPress={openForgotPassword}
              />
            </View>

            <AppButton
              title={t('login.signIn')}
              icon="arrow-right"
              isIconRight
              onPress={handleLogin}
              isLoading={isLoading}
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <AppText
                variant="caption"
                color={colors.textSecondary}
                style={styles.dividerText}
              >
                {t('login.or')}
              </AppText>
              <View style={styles.dividerLine} />
            </View>

            <SupportCard />
          </Card>
        </View>
      </ScrollView>
      <LoginToolbar />
    </KeyboardAvoidingView>
  );
}
