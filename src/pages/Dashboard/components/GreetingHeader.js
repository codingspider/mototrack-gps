// Home header from the design: the logo and the profile button. Alerts, dark mode, settings and the rest live
// inside the Profile screen.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../../../components/common/AppLogo';
import routeNames from '../../../routes/routeNames';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { useTranslation } from '../../../i18n/LanguageContext';

const ACTION_ICON_SIZE = 22;
const LOGO_HEIGHT = 52;

const makeStyles = (colors) =>
  StyleSheet.create({
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    actionButton: { margin: 0, borderWidth: 2, borderColor: colors.primary },
  });

export default function GreetingHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppLogo height={LOGO_HEIGHT} />
      <View>
        <IconButton
          icon="account-outline"
          size={ACTION_ICON_SIZE}
          iconColor={colors.primary}
          containerColor={colors.primaryLight}
          style={styles.actionButton}
          accessibilityLabel={t('home.profile')}
          onPress={() => navigation.navigate(routeNames.account)}
        />
      </View>
    </View>
  );
}
