// A tree with layered leaves that sways gently in the wind (own animation, runs on the native side).
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, Rect } from 'react-native-svg';
import { useAppTheme } from '../../../theme';

const BASE_WIDTH = 30;
const BASE_HEIGHT = 44;
const MAX_SWAY_DEG = 3.5;

/**
 * @param {number} x Ground position x (middle of the trunk)
 * @param {number} y Ground position y
 * @param {number} size 1 = normal tree
 * @param {number} delay Start delay in ms, so trees do not sway together
 * @param {number} duration One sway in ms
 */
export default function CityTree({ x, y, size = 1, delay = 0, duration = 2600 }) {
  const { colors } = useAppTheme();
  const sway = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(sway, { toValue: 1, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
        Animated.timing(sway, { toValue: 0, duration, easing: Easing.inOut(Easing.sin), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [sway, delay, duration]);

  const width = BASE_WIDTH * size;
  const height = BASE_HEIGHT * size;
  const rotate = sway.interpolate({
    inputRange: [0, 1],
    outputRange: [`${-MAX_SWAY_DEG}deg`, `${MAX_SWAY_DEG}deg`],
  });

  return (
    <>
      {/* Ground shadow stays still */}
      <Svg style={[styles.layer, { left: x - width * 0.6, top: y - 5 * size }]} width={width * 1.2} height={10 * size}>
        <Ellipse cx={width * 0.6} cy={5 * size} rx={width * 0.5} ry={4 * size} fill={colors.sceneGroundShade} />
      </Svg>
      <Animated.View
        style={[styles.layer, styles.tree, { left: x - width / 2, top: y - height, transform: [{ rotate }] }]}
      >
        <Svg width={width} height={height} viewBox={`0 0 ${BASE_WIDTH} ${BASE_HEIGHT}`}>
          <Rect x={13} y={26} width={4} height={18} rx={1.5} fill={colors.sceneTrunk} />
          <Circle cx={15} cy={21} r={11} fill={colors.sceneTreeDark} />
          <Circle cx={10} cy={16} r={8} fill={colors.sceneTreeMid} />
          <Circle cx={20} cy={15} r={8} fill={colors.sceneTreeMid} />
          <Circle cx={15} cy={10} r={8.5} fill={colors.sceneTreeMid} />
          <Circle cx={12} cy={8} r={4.5} fill={colors.sceneTreeLight} />
          <Circle cx={19} cy={13} r={3} fill={colors.sceneTreeLight} />
        </Svg>
      </Animated.View>
    </>
  );
}

const styles = StyleSheet.create({
  layer: { position: 'absolute' },
  // Sway from the foot of the trunk, like a real tree
  tree: { transformOrigin: 'center bottom' },
});

