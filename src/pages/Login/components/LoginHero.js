// Top of the Login screen: brand shapes behind the animated city scene.
import React from 'react';
import { StyleSheet, useWindowDimensions, View } from 'react-native';
import { radius, useThemedStyles } from '../../../theme';
import CityScene, { SCENE_HEIGHT, SCENE_WIDTH } from './CityScene';

const makeStyles = (colors) =>
  StyleSheet.create({
    hero: {
      backgroundColor: colors.secondary,
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
      backgroundColor: colors.primary,
    },
    ribbon: {
      position: 'absolute',
      top: 40,
      left: -60,
      width: 240,
      height: 90,
      backgroundColor: colors.primary,
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
  const { width } = useWindowDimensions();
  // The scene is drawn at a fixed size and scaled to fit any screen width
  const scale = width / SCENE_WIDTH;

  return (
    <View style={[styles.hero, { height: SCENE_HEIGHT * scale }]}>
      <View style={styles.circle} />
      <View style={styles.ribbon} />
      <View style={[styles.sceneBox, { transform: [{ scale }] }]}>
        <CityScene />
      </View>
    </View>
  );
}
