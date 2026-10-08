// The MotoTrack logo from the server (/app-settings). Fixed size from the start, so nothing jumps when it loads.
// Shows a gray block while the link is unknown, and the app name as text if there is no logo at all.
import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from './AppText';
import Skeleton from '../skeleton/Skeleton';
import { selectAppSettings, selectAppSettingsStatus } from '../../store/slices/appSlice';
import { useAppTheme } from '../../theme';

const LOGO_ASPECT_RATIO = 594 / 191; // the current logo is 594 x 191 px

/**
 * @param {number} height Logo height; the width follows the logo's shape
 */
export default function AppLogo({ height = 44 }) {
  const { colors } = useAppTheme();
  const settings = useSelector(selectAppSettings);
  const status = useSelector(selectAppSettingsStatus);
  const width = Math.round(height * LOGO_ASPECT_RATIO);

  if (settings?.logo) {
    return <Image source={{ uri: settings.logo }} style={{ width, height }} resizeMode="contain" fadeDuration={150} />;
  }
  // Nothing saved yet and the server has not answered: hold the space
  if (status === 'idle' || status === 'loading') {
    return <Skeleton width={width} height={height} />;
  }
  return (
    <AppText variant="title" color={colors.primary} style={styles.fallback}>
      MotoTrack24
    </AppText>
  );
}

const styles = StyleSheet.create({
  fallback: { includeFontPadding: false },
});
