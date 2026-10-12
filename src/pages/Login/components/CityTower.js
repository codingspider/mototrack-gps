// A mobile network tower for the Login city, drawn only with SVG shapes (no image): a tall four-legged steel
// lattice with red and grey sections, a ladder, two dish antennas, a top platform with a mast, and a concrete
// base slab. A red beacon blinks on top and signal rings grow out of the mast tip, like a radar.
// Positions are in the 390 x 270 scene space of CityScene.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Ellipse, Line, Polygon, Rect } from 'react-native-svg';
import { radius, useAppTheme } from '../../../theme';

// The drawing is made in a 60 x 125 box and shown at this scale
const BOX_WIDTH = 60;
const BOX_HEIGHT = 125;
const SCALE = 0.8;
const TOWER_WIDTH = BOX_WIDTH * SCALE;
const TOWER_HEIGHT = BOX_HEIGHT * SCALE;
const MAST_TIP = [30, 4]; // where the signal comes from, in the drawing box
const RING_SIZE = 80;
const RING_COUNT = 3;
const RING_MS = 2100; // one ring grows and fades in this time
const BEACON_SIZE = 6;

// The four legs, each [top end, foot]. L = left, F = front, R = right, B = back (seen from the front corner).
const LEGS = {
  L: [[26, 22], [12, 104.5]],
  F: [[30, 25], [30, 113]],
  R: [[34, 22], [48, 104.5]],
  B: [[30, 19], [30, 96]],
};
// Heights where the sections meet (0 = top, 1 = foot) and whether the section is red (else grey)
const LEVELS = [0, 0.28, 0.6, 1];
const SECTION_IS_RED = [true, false, true];
// Faces to cross-brace: the two front faces fully, the two back faces lightly (they are behind)
const FACES = [
  ['L', 'F', 1],
  ['F', 'R', 1],
  ['L', 'B', 0.35],
  ['B', 'R', 0.35],
];

/** The point of a leg at height t (0 = top, 1 = foot). */
const at = (leg, t) => [leg[0][0] + (leg[1][0] - leg[0][0]) * t, leg[0][1] + (leg[1][1] - leg[0][1]) * t];

/** One signal ring: starts small at the antenna, grows, and fades away. */
function RadarRing({ delay, color }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.delay(delay),
        Animated.timing(progress, { toValue: 1, duration: RING_MS, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(progress, { toValue: 0, duration: 0, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress, delay]);

  return (
    <Animated.View
      style={[
        styles.ring,
        {
          borderColor: color,
          opacity: progress.interpolate({ inputRange: [0, 0.15, 1], outputRange: [0, 0.9, 0] }),
          transform: [{ scale: progress.interpolate({ inputRange: [0, 1], outputRange: [0.15, 1.4] }) }],
        },
      ]}
    />
  );
}

/** The steel lattice: legs, X braces and a ring for each section. */
function Lattice({ redColor, greyColor }) {
  const parts = [];
  SECTION_IS_RED.forEach((isRed, section) => {
    const color = isRed ? redColor : greyColor;
    const t0 = LEVELS[section];
    const t1 = LEVELS[section + 1];

    Object.entries(LEGS).forEach(([name, leg]) => {
      const [x0, y0] = at(leg, t0);
      const [x1, y1] = at(leg, t1);
      const isBack = name === 'B';
      parts.push(
        <Line
          key={`leg${name}${section}`}
          x1={x0}
          y1={y0}
          x2={x1}
          y2={y1}
          stroke={color}
          strokeWidth={isBack ? 1.1 : 1.9}
          opacity={isBack ? 0.5 : 1}
        />,
      );
    });

    FACES.forEach(([a, b, opacity]) => {
      const a0 = at(LEGS[a], t0);
      const a1 = at(LEGS[a], t1);
      const b0 = at(LEGS[b], t0);
      const b1 = at(LEGS[b], t1);
      parts.push(
        <Line key={`xa${a}${b}${section}`} x1={a0[0]} y1={a0[1]} x2={b1[0]} y2={b1[1]} stroke={color} strokeWidth={0.9} opacity={opacity} />,
        <Line key={`xb${a}${b}${section}`} x1={b0[0]} y1={b0[1]} x2={a1[0]} y2={a1[1]} stroke={color} strokeWidth={0.9} opacity={opacity} />,
      );
    });

    // The ring at the bottom of the section: the four corners joined
    const corners = ['L', 'F', 'R', 'B'].map((name) => at(LEGS[name], t1));
    parts.push(
      <Polygon
        key={`ring${section}`}
        points={corners.map((point) => point.join(',')).join(' ')}
        fill="none"
        stroke={color}
        strokeWidth={1.2}
      />,
    );
  });
  return <>{parts}</>;
}

/** A ladder up the front leg: two rails and a rung every few units. */
function Ladder({ color }) {
  const rungs = [];
  for (let y = 30; y <= 108; y += 4.5) {
    rungs.push(<Line key={y} x1={27.8} y1={y} x2={32.2} y2={y} stroke={color} strokeWidth={0.8} />);
  }
  return (
    <>
      <Line x1={27.8} y1={28} x2={27.8} y2={110} stroke={color} strokeWidth={1} />
      <Line x1={32.2} y1={28} x2={32.2} y2={110} stroke={color} strokeWidth={1} />
      {rungs}
    </>
  );
}

/**
 * @param {number} x Ground position x (middle of the base slab)
 * @param {number} y Ground position y (bottom of the base slab)
 */
export default function CityTower({ x, y }) {
  const { colors } = useAppTheme();
  const beacon = useRef(new Animated.Value(1)).current;
  const left = x - TOWER_WIDTH / 2;
  const top = y - TOWER_HEIGHT;
  const tipX = left + MAST_TIP[0] * SCALE;
  const tipY = top + MAST_TIP[1] * SCALE;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(beacon, { toValue: 0.15, duration: 600, useNativeDriver: true }),
        Animated.timing(beacon, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [beacon]);

  const red = colors.secondary;
  const grey = colors.sceneTower;
  const dishFill = colors.sceneBuildingTop;

  return (
    <>
      {/* Signal rings are centered on the mast tip */}
      <View style={[styles.ringBox, { left: tipX - RING_SIZE / 2, top: tipY - RING_SIZE / 2 }]}>
        {Array.from({ length: RING_COUNT }, (_, index) => (
          <RadarRing key={index} delay={(index * RING_MS) / RING_COUNT} color={colors.sceneRadar} />
        ))}
      </View>

      <Svg
        width={TOWER_WIDTH}
        height={TOWER_HEIGHT}
        viewBox={`0 0 ${BOX_WIDTH} ${BOX_HEIGHT}`}
        style={[styles.drawing, { left, top }]}
      >
        {/* Concrete base slab: top, left and right faces, and the foot pads */}
        <Polygon points="30,94 54,105 30,116 6,105" fill={colors.sceneBuildingTop} />
        <Polygon points="6,105 30,116 30,123 6,112" fill={colors.sceneBuildingLeft} />
        <Polygon points="30,116 54,105 54,112 30,123" fill={colors.sceneBuildingRight} />
        <Ellipse cx={12} cy={104.5} rx={2.6} ry={1.2} fill={colors.sceneGroundShade} />
        <Ellipse cx={30} cy={113} rx={2.6} ry={1.2} fill={colors.sceneGroundShade} />
        <Ellipse cx={48} cy={104.5} rx={2.6} ry={1.2} fill={colors.sceneGroundShade} />

        <Lattice redColor={red} greyColor={grey} />
        <Ladder color={grey} />

        {/* Dish antennas: a large one on the left, a smaller one near the top right */}
        <Line x1={21} y1={51.5} x2={14.5} y2={50} stroke={grey} strokeWidth={1.2} />
        <Ellipse cx={10.5} cy={50} rx={5} ry={7} fill={dishFill} stroke={grey} strokeWidth={1} />
        <Ellipse cx={11.5} cy={50} rx={1.2} ry={1.6} fill={red} />
        <Line x1={33} y1={24} x2={37} y2={26} stroke={grey} strokeWidth={1.2} />
        <Ellipse cx={40.5} cy={26} rx={3.4} ry={5} fill={dishFill} stroke={grey} strokeWidth={1} />

        {/* Top platform with red rails, the mast and two panel antennas */}
        <Polygon points="21,19 30,23.5 39,19 30,14.5" fill={dishFill} stroke={red} strokeWidth={1.2} />
        <Line x1={30} y1={15} x2={30} y2={4} stroke={red} strokeWidth={1.8} />
        <Rect x={27} y={7} width={2.6} height={9} rx={0.8} fill={dishFill} stroke={grey} strokeWidth={0.8} />
        <Rect x={30.6} y={7} width={2.6} height={9} rx={0.8} fill={dishFill} stroke={grey} strokeWidth={0.8} />
        <Line x1={23} y1={18} x2={21} y2={11} stroke={red} strokeWidth={1.2} />
        <Line x1={37} y1={18} x2={39} y2={11} stroke={red} strokeWidth={1.2} />
      </Svg>

      <Animated.View
        style={[
          styles.beacon,
          {
            left: tipX - BEACON_SIZE / 2,
            top: tipY - BEACON_SIZE / 2,
            backgroundColor: colors.secondary,
            opacity: beacon,
          },
        ]}
      />
    </>
  );
}

const styles = StyleSheet.create({
  drawing: { position: 'absolute' },
  ringBox: { position: 'absolute', width: RING_SIZE, height: RING_SIZE },
  ring: {
    position: 'absolute',
    width: RING_SIZE,
    height: RING_SIZE,
    borderRadius: radius.round,
    borderWidth: 2,
  },
  beacon: { position: 'absolute', width: BEACON_SIZE, height: BEACON_SIZE, borderRadius: radius.round },
});
