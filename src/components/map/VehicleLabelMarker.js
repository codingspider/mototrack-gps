// The name tag above the vehicle on the vehicle map (plate number, or the device name when there is no plate).
// It is its own marker on the same moving coordinate, so it glides with the vehicle and never rotates with it.
import React, { useEffect, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { MarkerAnimated } from 'react-native-maps';
import AppText from '../common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const GAP_ABOVE_VEHICLE = 22; // the marker's bottom edge is at the vehicle's centre: leave room for the picture
const MAX_WIDTH = 180;
const REFRESH_MAX_MS = 1500; // a marker is a picture of its view: refresh it for a moment, then stop (cheaper)

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { paddingBottom: GAP_ABOVE_VEHICLE, alignItems: 'center' },
    tag: {
      maxWidth: MAX_WIDTH,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.primary,
    },
    text: { fontWeight: '700' },
  });

/**
 * @param {object} coordinate The vehicle's animated coordinate (the same one the vehicle marker uses)
 * @param {string} text What to show
 */
export default function VehicleLabelMarker({ coordinate, text }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [isTrackingView, setIsTrackingView] = useState(true);

  useEffect(() => {
    setIsTrackingView(true);
    const timer = setTimeout(() => setIsTrackingView(false), REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, [text, colors]);

  if (!coordinate || !text) {
    return null;
  }

  return (
    <MarkerAnimated coordinate={coordinate} anchor={{ x: 0.5, y: 1 }} tracksViewChanges={isTrackingView} zIndex={2}>
      <View style={styles.wrapper}>
        <View style={styles.tag}>
          <AppText variant="caption" numberOfLines={1} style={styles.text}>
            {text}
          </AppText>
        </View>
      </View>
    </MarkerAnimated>
  );
}
