// The 4 x 2 grid of vehicle actions: history, reports, overspeed, geofence, engine, driving, live video, payments.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useDispatch } from 'react-redux';
import AppText from '../../../components/common/AppText';
import { showToast } from '../../../store/slices/toastSlice';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const ACTIONS = [
  { key: 'history', label: 'History', icon: 'history' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
  { key: 'overspeed', label: 'Overspeed', icon: 'speedometer' },
  { key: 'geofence', label: 'Geofence', icon: 'dots-circle' },
  { key: 'engine', label: 'Engine', icon: 'power' },
  { key: 'driving', label: 'Driving', icon: 'steering' },
  { key: 'video', label: 'Live video', icon: 'video-outline' },
  { key: 'payments', label: 'Payments', icon: 'credit-card-outline' },
];

const makeStyles = (colors) =>
  StyleSheet.create({
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
    item: { width: '23.5%', borderRadius: radius.md, backgroundColor: colors.surface, elevation: 1 },
    itemContent: { alignItems: 'center', paddingVertical: spacing.md, gap: spacing.sm },
    label: { fontWeight: '700' },
  });

export default function ActionGrid() {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  // Each action gets its own page later; until then tell the user it is on the way.
  const handlePress = (action) =>
    dispatch(showToast({ type: 'info', message: `${action.label} is coming soon` }));

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
