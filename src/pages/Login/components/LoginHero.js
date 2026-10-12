// Top of the Login screen: the sky (red by day, a starry night in dark mode) behind the animated city scene.
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { radius, useAppTheme, useThemedStyles } from '../../../theme';
import CityScene, { SCENE_HEIGHT, SCENE_WIDTH } from './CityScene';
import NightSky from './NightSky';

const makeStyles = colors =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.sceneSky,
      borderBottomLeftRadius: 36,
      borderBottomRightRadius: 36,
      overflow: 'hidden',
    },
    circle: {
      position: 'absolute',
      top: -90,
      right: -60,
      width: 220,
      height: 220,
      borderRadius: radius.round,
      backgroundColor: colors.sceneMoon,
    },
    moonHalo: {
      position: 'absolute',
      top: -130,
      right: -100,
      width: 300,
      height: 300,
      borderRadius: radius.round,
      backgroundColor: colors.sceneMoon,
      opacity: 0.12,
    },
    ribbon: {
      position: 'absolute',
      top: 40,
      left: -60,
      width: 240,
      height: 90,
      backgroundColor: colors.sceneSkyBand,
      transform: [{ rotate: '-14deg' }],
    },
    sceneBox: {
      position: 'absolute',
      left: 0,
      top: 0,
      width: SCENE_WIDTH,
      height: SCENE_HEIGHT,
      transformOrigin: 'top left',
    },
  });

export default function LoginHero() {
  const styles = useThemedStyles(makeStyles);
  const { isDark } = useAppTheme();
  const { width } = useWindowDimensions();
  // The scene is drawn at a fixed size and scaled to fit any screen width
  const scale = width / SCENE_WIDTH;

  return (
    <View style={[styles.hero, { height: SCENE_HEIGHT * scale }]}>
      {isDark && <NightSky />}
      {isDark && <View style={styles.moonHalo} />}
      <View style={styles.circle} />
      <View style={styles.ribbon} />
      <View style={[styles.sceneBox, { transform: [{ scale }] }]}>
        <CityScene />
      </View>
    </View>
  );
}
