// Home header from the design: the logo, alerts bell, profile button and light/dark switch.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppLogo from '../../../components/common/AppLogo';
import routeNames from '../../../routes/routeNames';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

const ACTION_ICON_SIZE = 22;
const LOGO_HEIGHT = 52; // big enough to read clearly, small enough to leave room for the three buttons

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
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    actionButton: { margin: 0, borderWidth: 2, borderColor: colors.primary },
  });

export default function GreetingHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <AppLogo height={LOGO_HEIGHT} />
      <View style={styles.actions}>
        {/* All three buttons share the same size and style */}
        <IconButton
          icon="bell-outline"
          size={ACTION_ICON_SIZE}
          iconColor={colors.primary}
          containerColor={colors.primaryLight}
          style={styles.actionButton}
          accessibilityLabel="Alerts"
          onPress={() => navigation.navigate(routeNames.alerts)}
        />
        <IconButton
          icon="account-outline"
          size={ACTION_ICON_SIZE}
          iconColor={colors.primary}
          containerColor={colors.primaryLight}
          style={styles.actionButton}
          accessibilityLabel="Profile"
          onPress={() => navigation.navigate(routeNames.account)}
        />
        <IconButton
          icon={isDark ? 'white-balance-sunny' : 'weather-night'}
          size={ACTION_ICON_SIZE}
          iconColor={colors.primary}
          containerColor={colors.primaryLight}
          style={styles.actionButton}
          accessibilityLabel={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
          onPress={toggleTheme}
        />
      </View>
    </View>
  );
}
