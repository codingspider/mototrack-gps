// The 4 x 2 grid of vehicle actions: history, reports, overspeed, geofence, engine, driving, live video, payments.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { showToast } from '../../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const ACTIONS = [
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
  { key: 'overspeed', label: 'Overspeed', icon: 'speedometer' },
  { key: 'geofence', label: 'Geofence', icon: 'dots-circle' },
  { key: 'engine', label: 'Engine', icon: 'power' },
  { key: 'driving', label: 'Driving', icon: 'steering' },
  { key: 'playback', label: 'Playback', icon: 'play-circle-outline' },
  { key: 'payments', label: 'Payments', icon: 'credit-card-outline' },
];

const makeStyles = (colors) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
    item: { width: '23.5%', borderRadius: radius.md, backgroundColor: colors.surface, elevation: 1 },
    itemContent: { alignItems: 'center', paddingVertical: spacing.sm, gap: spacing.xs },
    label: { fontWeight: '700' },
  });

/** @param {number} vehicleId The vehicle the actions are for */
export default function ActionGrid({ vehicleId }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  // History and Playback are the same page (the route replay); other actions get their page later.
  const handlePress = (action) => {
    if (action.key === 'history' || action.key === 'playback') {
      navigation.navigate(routeNames.playback, { id: vehicleId });
      return;
    }
    dispatch(showToast({ type: 'info', message: `${action.label} is coming soon` }));
  };

  return (
    <View style={styles.grid}>
      {ACTIONS.map((action) => (
        <TouchableRipple key={action.key} borderless style={styles.item} onPress={() => handlePress(action)}>
          <View style={styles.itemContent}>
            <Icon source={action.icon} size={24} color={colors.primary} />
            <AppText variant="caption" style={styles.label} numberOfLines={1}>
              {action.label}
            </AppText>
          </View>
        </TouchableRipple>
      ))}
    </View>
  );
}
