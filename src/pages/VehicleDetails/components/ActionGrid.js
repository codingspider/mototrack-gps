// The vehicle actions in one row that scrolls sideways: playback, reports, overspeed, geofence, engine...
import React, { useRef, useState } from 'react';
import { Animated, ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { showToast } from '../../../store/slices/toastSlice';
import { VEHICLE_ACTIONS } from '../../../utils/vehicleActions';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import EngineControlModal from './EngineControlModal';
import ShareLocationModal from './ShareLocationModal';

const ITEM_WIDTH = 84;
const TRACK_WIDTH = 72; // the slider under the row
const THUMB_MIN_WIDTH = 20;

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { gap: spacing.sm, paddingVertical: spacing.xs },
    item: { width: ITEM_WIDTH, borderRadius: radius.md, backgroundColor: colors.surface, elevation: 1 },
    itemContent: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.xs, gap: spacing.xs },
    label: { fontWeight: '700', textAlign: 'center' },
    track: {
      alignSelf: 'center',
      width: TRACK_WIDTH,
      height: 4,
      borderRadius: radius.round,
      backgroundColor: colors.border,
      overflow: 'hidden',
      marginTop: spacing.xs,
    },
    thumb: { height: 4, borderRadius: radius.round, backgroundColor: colors.primary },
  });

/** @param {number} vehicleId The vehicle the actions are for */
export default function ActionGrid({ vehicleId }) {
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [isEngineOpen, setIsEngineOpen] = useState(false);
  const [isShareOpen, setIsShareOpen] = useState(false);
  // Slider under the row: how wide the row is, and how wide its content is
  const [rowWidth, setRowWidth] = useState(0);
  const [contentWidth, setContentWidth] = useState(0);
  const scrollX = useRef(new Animated.Value(0)).current;
  const canScroll = contentWidth > rowWidth && rowWidth > 0;
  const thumbWidth = canScroll ? Math.max(THUMB_MIN_WIDTH, (rowWidth / contentWidth) * TRACK_WIDTH) : TRACK_WIDTH;
  const thumbTravel = TRACK_WIDTH - thumbWidth;
  const maxScroll = Math.max(contentWidth - rowWidth, 1);
  const thumbX = scrollX.interpolate({
    inputRange: [0, maxScroll],
    outputRange: [0, thumbTravel],
    extrapolate: 'clamp',
  });

  // Actions with isReady false show "coming soon".
  const handlePress = (action) => {
    if (action.isReady === false) {
      dispatch(showToast({ type: 'info', message: `${action.label} is coming soon` }));
      return;
    }
    if (action.key === 'playback') {
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
      setIsShareOpen(true);
    } else if (action.key === 'payments') {
      navigation.navigate(routeNames.payments, { vehicleId });
    } else if (action.key === 'reports') {
      // The one-vehicle report summary (the full list of reports is its "All reports" link)
      navigation.navigate(routeNames.reportSummary, { vehicleId });
    }
  };

  return (
    <View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}
        scrollEventThrottle={16}
        onLayout={(event) => setRowWidth(event.nativeEvent.layout.width)}
        onContentSizeChange={(width) => setContentWidth(width)}
        onScroll={Animated.event([{ nativeEvent: { contentOffset: { x: scrollX } } }], { useNativeDriver: false })}
      >
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
      {canScroll && (
        <View style={styles.track}>
          <Animated.View style={[styles.thumb, { width: thumbWidth, transform: [{ translateX: thumbX }] }]} />
        </View>
      )}
      <EngineControlModal visible={isEngineOpen} onDismiss={() => setIsEngineOpen(false)} vehicleId={vehicleId} />
      <ShareLocationModal visible={isShareOpen} onDismiss={() => setIsShareOpen(false)} vehicleId={vehicleId} />
    </View>
  );
}
