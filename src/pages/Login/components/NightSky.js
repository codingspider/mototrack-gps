// Stars that twinkle in the Login header at night (dark mode only). Positions are shares of the header size.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { radius, useAppTheme } from '../../../theme';

// [left %, top %, size, delay ms, duration ms]
const STARS = [
  [8, 10, 3, 0, 1800],
  [22, 26, 2, 600, 2200],
  [38, 8, 3, 1100, 2000],
  [47, 30, 2, 300, 2600],
  [58, 14, 2, 900, 1900],
  [70, 34, 3, 1500, 2300],
  [82, 22, 2, 200, 2100],
  [14, 44, 2, 1200, 2500],
  [30, 52, 3, 700, 2000],
  [90, 46, 2, 1000, 2400],
];

function Star({ left, top, size, delay, duration, color }) {
  const twinkle = useRef(new Animated.Value(0.2)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(twinkle, {
          toValue: 1,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
        Animated.timing(twinkle, {
          toValue: 0.2,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: true,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [twinkle, delay, duration]);

  return (
    <Animated.View
      style={[
        styles.star,
        {
          left: `${left}%`,
          top: `${top}%`,
          width: size,
          height: size,
          backgroundColor: color,
          opacity: twinkle,
        },
      ]}
    />
  );
}

export default function NightSky() {
  const { colors } = useAppTheme();

  return (
    <View style={StyleSheet.absoluteFill} pointerEvents="none">
      {STARS.map(([left, top, size, delay, duration]) => (
        <Star
          key={`${left}-${top}`}
          left={left}
          top={top}
          size={size}
          delay={delay}
          duration={duration}
          color={colors.sceneStar}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  star: { position: 'absolute', borderRadius: radius.round },
});
