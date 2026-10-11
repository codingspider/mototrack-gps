// The vehicle actions in one row that scrolls sideways: playback, history, reports, overspeed, geofence, engine...
import React, { useState } from 'react';
import { ScrollView, Share, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { showToast } from '../../../store/slices/toastSlice';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { VEHICLE_ACTIONS, buildShareMessage } from '../../../utils/vehicleActions';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import EngineControlModal from './EngineControlModal';

const ITEM_WIDTH = 84;

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    item: { width: ITEM_WIDTH, borderRadius: radius.md, backgroundColor: colors.surface, elevation: 1 },
    itemContent: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.xs },
    label: { fontWeight: '700', textAlign: 'center' },
  });

/** @param {number} vehicleId The vehicle the actions are for */
export default function ActionGrid({ vehicleId }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const [isEngineOpen, setIsEngineOpen] = useState(false);

  const shareLocation = async () => {
    const message = buildShareMessage(vehicle);
    if (!message) {
      dispatch(showToast({ type: 'warning', message: 'This vehicle has no location to share yet' }));
      return;
    }
    try {
      await Share.share({ message });
    } catch (error) {
      dispatch(showToast({ type: 'error', message: 'Could not open the share menu' }));
    }
  };

  // History and Playback are the same page (the route replay); actions with isReady false show "coming soon".
  const handlePress = (action) => {
    if (action.isReady === false) {
      dispatch(showToast({ type: 'info', message: `${action.label} is coming soon` }));
      return;
    }
    if (action.key === 'history' || action.key === 'playback') {
      navigation.navigate(routeNames.playback, { id: vehicleId });
    } else if (action.key === 'overspeed') {
      navigation.navigate(routeNames.overspeed, { id: vehicleId });
    } else if (action.key === 'geofence') {
      navigation.navigate(routeNames.geofences, { id: vehicleId });
    } else if (action.key === 'alarm') {
      navigation.navigate(routeNames.deviceAlerts, { id: vehicleId });
    } else if (action.key === 'routeAnalytics') {
      navigation.navigate(routeNames.routeFinder, { mode: 'analytics', vehicleId });
    } else if (action.key === 'routeFinder') {
      navigation.navigate(routeNames.routeFinder, { mode: 'finder', vehicleId });
    } else if (action.key === 'fuel') {
      navigation.navigate(routeNames.fuelSettings, { id: vehicleId });
    } else if (action.key === 'engine') {
      setIsEngineOpen(true);
    } else if (action.key === 'share') {
      shareLocation();
    } else if (action.key === 'payments') {
      navigation.navigate(routeNames.payments, { vehicleId });
    } else if (action.key === 'reports') {
      // The one-vehicle report summary (the full list of reports is its "All reports" link)
      navigation.navigate(routeNames.reportSummary, { vehicleId });
    }
  };

  return (
    <View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
        {VEHICLE_ACTIONS.map((action) => (
          <TouchableRipple key={action.key} borderless style={styles.item} onPress={() => handlePress(action)}>
            <View style={styles.itemContent}>
              <Icon source={action.icon} size={24} color={colors.primary} />
              <AppText variant="caption" style={styles.label} numberOfLines={1}>
                {action.label}
              </AppText>
            </View>
          </TouchableRipple>
        ))}
      </ScrollView>
      <EngineControlModal visible={isEngineOpen} onDismiss={() => setIsEngineOpen(false)} vehicleId={vehicleId} />
    </View>
  );
}
