// Two small buttons floating at the top right of the Login screen: language (English / Bangla) and theme (day / night).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../../components/common/AppText';
import { useTranslation } from '../../../i18n/LanguageContext';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const BUTTON_SIZE = 40;

const makeStyles = colors =>
  StyleSheet.create({
    bar: {
      position: 'absolute',
      right: spacing.md,
      flexDirection: 'row',
      gap: spacing.sm,
    },
    button: {
      minWidth: BUTTON_SIZE,
      height: BUTTON_SIZE,
      paddingHorizontal: spacing.sm,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 3,
    },
    label: { fontWeight: '700' },
  });

export default function LoginToolbar() {
  const { colors, isDark, toggleTheme } = useAppTheme();
  const { language, toggleLanguage, t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { top: insets.top + spacing.sm }]}>
      <TouchableRipple
        borderless
        style={styles.button}
        onPress={toggleLanguage}
        accessibilityLabel={t('login.language')}
      >
        {/* Shows the language you can switch to */}
        <AppText style={styles.label} color={colors.primary}>
          {language === 'en' ? 'বাংলা' : 'EN'}
        </AppText>
      </TouchableRipple>
      <TouchableRipple
        borderless
        style={styles.button}
        onPress={toggleTheme}
        accessibilityLabel={t('login.theme')}
      >
        <Icon
          source={isDark ? 'white-balance-sunny' : 'weather-night'}
          size={22}
          color={colors.primary}
        />
      </TouchableRipple>
    </View>
  );
}
