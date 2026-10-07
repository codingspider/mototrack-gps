// Gray block with a soft pulse. Build page skeletons out of these.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet } from 'react-native';
import { colors, radius } from '../../theme';

export default function Skeleton({ width = '100%', height = 16, style }) {
  const opacity = useRef(new Animated.Value(0.5)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 700, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.5, duration: 700, useNativeDriver: true }),
      ]),
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return <Animated.View style={[styles.block, { width, height, opacity }, style]} />;
}

const styles = StyleSheet.create({
  block: { backgroundColor: colors.skeleton, borderRadius: radius.sm },
});