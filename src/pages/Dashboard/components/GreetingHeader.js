// Home header from the design: logo, Live indicator, alerts bell, profile button and light/dark switch.
// TODO: swap the text logo for the real MotoTrack logo image in src/assets when it is added.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { selectSocketStatus } from '../../../store/slices/appSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const ACTION_ICON_SIZE = 22;

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
    live: { flexDirection: 'row', alignItems: 'center' },
    dot: { width: 8, height: 8, borderRadius: radius.round, marginRight: spacing.xs },
    actions: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    actionButton: { margin: 0, borderWidth: 2, borderColor: colors.primary },
  });

export default function GreetingHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { colors, isDark, toggleTheme } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const isLive = useSelector(selectSocketStatus) === 'connected';
  const liveColor = isLive ? colors.statusMoving : colors.statusOffline;

  return (
    <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
      <View>
        <AppText variant="title" color={colors.primary}>
          MotoTrack24
        </AppText>
        <View style={styles.live}>
          <View style={[styles.dot, { backgroundColor: liveColor }]} />
          <AppText variant="caption" color={liveColor}>
            {isLive ? 'Live' : 'Reconnecting…'}
          </AppText>
        </View>
      </View>
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
