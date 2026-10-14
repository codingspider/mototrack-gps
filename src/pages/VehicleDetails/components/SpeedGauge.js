// The speedometer dial: green, amber and red zones, tick labels and a needle that glides to the live speed.
// The needle is a plain View turned with Animated (native driver), the dial is drawn with react-native-svg.
import React, { useEffect, useRef } from 'react';
import { Animated, StyleSheet, View } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import AppText from '../../../components/common/AppText';
import { GAUGE_MAX_SPEED, GAUGE_ZONES, getArcPath, getArcPoint, getGaugeFraction } from '../../../utils/gauge';
import { radius, spacing, useAppTheme } from '../../../theme';

const DIAL_RADIUS = 54; // of the arc line
const STROKE = 9;
const SIZE = DIAL_RADIUS * 2 + STROKE; // the square that holds the dial; the arc is its upper half
const CENTER = SIZE / 2;
const NEEDLE_LENGTH = DIAL_RADIUS - 6;
const NEEDLE_WIDTH = 3;
const HUB_SIZE = 12;
// The needle follows the speed like a real one: a spring, not a timed animation. Timed animations on the native
// driver fail with "Calculated frame index should never be lower than 0" when they are restarted on every
// live update, because the phone's frame clock can step back for a moment. A spring has no frame index.
const NEEDLE_SPRING = { stiffness: 70, damping: 14, mass: 1, overshootClamping: true };
const TICK_SPEEDS = [0, 40, 80, 120, 160];
const TICK_LABEL_RADIUS = DIAL_RADIUS - 17; // the numbers sit inside the arc

/** @param {number} speed Live speed in km/h */
export default function SpeedGauge({ speed }) {
  const { colors } = useAppTheme();
  const fraction = useRef(new Animated.Value(getGaugeFraction(speed))).current;

  // A new speed moves the needle smoothly, up or down
  useEffect(() => {
    const spring = Animated.spring(fraction, {
      ...NEEDLE_SPRING,
      toValue: getGaugeFraction(speed),
      useNativeDriver: true,
    });
    spring.start();
    return () => spring.stop();
  }, [speed, fraction]);

  const rotate = fraction.interpolate({ inputRange: [0, 1], outputRange: ['-90deg', '90deg'] });
  const zoneColors = { ok: colors.statusOnline, warn: colors.accent, danger: colors.secondary };

  return (
    <View style={styles.dial}>
      <Svg width={SIZE} height={CENTER + STROKE} viewBox={`0 0 ${SIZE} ${CENTER + STROKE}`}>
        <Path
          d={getArcPath(CENTER, CENTER, DIAL_RADIUS, 0, 1)}
          stroke={colors.border}
          strokeWidth={STROKE + 4}
          strokeLinecap="round"
          fill="none"
        />
        {GAUGE_ZONES.map((zone) => (
          <Path
            key={zone.tone}
            d={getArcPath(CENTER, CENTER, DIAL_RADIUS, zone.from, zone.to)}
            stroke={zoneColors[zone.tone]}
            strokeWidth={STROKE}
            fill="none"
          />
        ))}
      </Svg>

      {TICK_SPEEDS.map((tick) => {
        const point = getArcPoint(CENTER, CENTER, TICK_LABEL_RADIUS, tick / GAUGE_MAX_SPEED);
        return (
          <AppText
            key={tick}
            variant="caption"
            color={colors.textSecondary}
            style={[styles.tick, { left: point.x - 14, top: point.y - 8 }]}
          >
            {tick}
          </AppText>
        );
      })}

      {/* The wrapper is as big as the dial and turns around its centre, so the needle turns around the hub */}
      <Animated.View style={[styles.needleWrapper, { transform: [{ rotate }] }]} pointerEvents="none">
        <View style={[styles.needle, { backgroundColor: colors.text }]} />
      </Animated.View>
      <View style={[styles.hub, { backgroundColor: colors.text, borderColor: colors.surface }]} />
    </View>
  );
}

const styles = StyleSheet.create({
  dial: { width: SIZE, height: CENTER + STROKE },
  tick: { position: 'absolute', width: 28, textAlign: 'center', fontSize: 10 },
  needleWrapper: { position: 'absolute', left: 0, top: 0, width: SIZE, height: SIZE },
  needle: {
    position: 'absolute',
    left: CENTER - NEEDLE_WIDTH / 2,
    top: CENTER - NEEDLE_LENGTH,
    width: NEEDLE_WIDTH,
    height: NEEDLE_LENGTH,
    borderRadius: radius.round,
  },
  hub: {
    position: 'absolute',
    left: CENTER - HUB_SIZE / 2,
    top: CENTER - HUB_SIZE / 2,
    width: HUB_SIZE,
    height: HUB_SIZE,
    borderRadius: radius.round,
    borderWidth: 2,
    marginTop: spacing.xs / 4,
  },
});
