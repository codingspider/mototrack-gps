// Home header from the design: logo, Live indicator, alerts bell and profile button.
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
import { colors, radius, spacing } from '../../../theme';

export default function GreetingHeader() {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
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
        {/* TODO: open Notifications once that screen exists */}
        <IconButton icon="bell-outline" size={26} iconColor={colors.primary} accessibilityLabel="Alerts" />
        <IconButton
          icon="account-outline"
          size={22}
          iconColor={colors.primary}
          containerColor={colors.primaryLight}
          style={styles.profile}
          accessibilityLabel="Profile"
          onPress={() => navigation.navigate(routeNames.account)}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
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
  actions: { flexDirection: 'row', alignItems: 'center' },
  profile: { borderWidth: 2, borderColor: colors.primary },
});
