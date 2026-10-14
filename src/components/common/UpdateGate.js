// Full screen "Update required" over the whole app while a newer version is on the Play Store. Mount once in App.js.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppButton from './AppButton';
import AppText from './AppText';
import AppLogo from './AppLogo';
import useForceUpdate from '../../hooks/useForceUpdate';
import { useTranslation } from '../../i18n/LanguageContext';
import { spacing, useAppTheme } from '../../theme';

const ICON_SIZE = 72;
const LOGO_HEIGHT = 52;

export default function UpdateGate() {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const { isRequired, isStarting, startUpdate } = useForceUpdate();

  if (!isRequired) {
    return null;
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <AppLogo height={LOGO_HEIGHT} />
      <Icon source="cellphone-arrow-down" size={ICON_SIZE} color={colors.primary} />
      <AppText variant="title" style={styles.center}>
        {t('update.title')}
      </AppText>
      <AppText color={colors.textSecondary} style={styles.center}>
        {t('update.message')}
      </AppText>
      <AppButton title={t('update.button')} icon="download" isLoading={isStarting} onPress={startUpdate} />
    </View>
  );
}

const styles = StyleSheet.create({
  // Above the navigation and the toasts: nothing behind it can be used
  screen: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1000,
    elevation: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.lg,
    padding: spacing.xl,
  },
  center: { textAlign: 'center' },
});
