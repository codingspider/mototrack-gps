// The red car, drawn as a small isometric 3D model like the buildings. It drives along the road
// points, then starts again from the pin. It heads south-east, the same way the road lines run.
import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet } from 'react-native';
import Svg, { Circle, Ellipse, G, Line, Polygon, Rect } from 'react-native-svg';
import { isoBoxFaces } from '../../../utils/isometric';
import { samplePath } from '../../../utils/pathSampler';
import { useAppTheme } from '../../../theme';

// Size on screen. The art below is drawn in a "-38 -42 58 50" box (front-bottom corner at 0,0).
const CAR_WIDTH = 49;
const CAR_HEIGHT = 42;
// Where the middle of the car's footprint sits inside that box, so it stays on the road line
const CENTER_X = 24;
const CENTER_Y = 25;

const SAMPLES_PER_CURVE = 24;
const DRIVE_MS = 8000;
const PAUSE_MS = 700;
const ISO_HEADING_DEG = 26.57; // direction of an isometric road line (2:1)
const TURN_FACTOR = 0.7; // how much of the road's bend the car follows

const BODY = { length: 34, width: 15, height: 7 };
const CABIN = { length: 18, width: 12, height: 6.5, setback: 9, inset: 1.5 };
const CABIN_X = -CABIN.setback + CABIN.inset;
const CABIN_Y = -(CABIN.setback + CABIN.inset) / 2 - BODY.height;

const bodyFaces = isoBoxFaces(0, 0, BODY.length, BODY.width, BODY.height);
const cabinFaces = isoBoxFaces(CABIN_X, CABIN_Y, CABIN.length, CABIN.width, CABIN.height);

// Flat drawing spaces glued onto the faces: u runs along the face, v goes up.
const BODY_SIDE = 'matrix(-1 -0.5 0 -1 0 0)';
const BODY_FRONT = 'matrix(1 -0.5 0 -1 0 0)';
const CABIN_SIDE = `matrix(-1 -0.5 0 -1 ${CABIN_X} ${CABIN_Y})`;
const CABIN_FRONT = `matrix(1 -0.5 0 -1 ${CABIN_X} ${CABIN_Y})`;

function CarArt() {
  const { colors } = useAppTheme();
  // Tyres, grille and shadow stay dark and lights stay white in both light and dark mode
  const dark = colors.shadow;
  const white = colors.textOnPrimary;

  return (
    <Svg width={CAR_WIDTH} height={CAR_HEIGHT} viewBox="-38 -42 58 50">
      {/* Shadow on the road */}
      <Polygon points="3,3 -31,-14 -16,-21.5 18,-4.5" fill={dark} opacity={0.2} />

      {/* Body */}
      <Polygon points={bodyFaces.left} fill={colors.sceneCarShade} />
      <Polygon points={bodyFaces.right} fill={colors.secondary} />
      <Polygon points={bodyFaces.top} fill={colors.secondary} />
      <Polygon points={bodyFaces.top} fill={white} opacity={0.22} />

      {/* Side panel: highlight stripe, door lines, wheels */}
      <G transform={BODY_SIDE}>
        <Rect x={0} y={4.6} width={BODY.length} height={0.6} fill={white} opacity={0.3} />
        <Line x1={11} y1={1.8} x2={11} y2={6.4} stroke={dark} strokeWidth={0.5} opacity={0.35} />
        <Line x1={23} y1={1.8} x2={23} y2={6.4} stroke={dark} strokeWidth={0.5} opacity={0.35} />
        <Circle cx={7} cy={0.8} r={3.7} fill={dark} />
        <Circle cx={7} cy={0.8} r={1.7} fill={colors.sceneRoadEdge} />
        <Circle cx={27} cy={0.8} r={3.7} fill={dark} />
        <Circle cx={27} cy={0.8} r={1.7} fill={colors.sceneRoadEdge} />
      </G>

      {/* Front: bumper, grille, headlights */}
      <G transform={BODY_FRONT}>
        <Rect x={0} y={0} width={BODY.width} height={1.6} fill={colors.sceneCarShade} />
        <Rect x={4.8} y={1.9} width={5.4} height={2.4} rx={0.6} fill={dark} opacity={0.75} />
        <Rect x={1} y={3.7} width={3} height={2} rx={0.8} fill={white} />
        <Rect x={11} y={3.7} width={3} height={2} rx={0.8} fill={white} />
      </G>

      {/* Cabin (roof part) */}
      <Polygon points={cabinFaces.left} fill={colors.sceneCarShade} />
      <Polygon points={cabinFaces.right} fill={colors.secondary} />
      <G transform={CABIN_SIDE}>
        <Rect x={1.2} y={1.2} width={CABIN.length - 2.4} height={4.2} rx={1} fill={colors.sceneWindow} />
        <Line x1={9} y1={1.2} x2={9} y2={5.4} stroke={colors.sceneCarShade} strokeWidth={1} />
      </G>
      <G transform={CABIN_FRONT}>
        <Rect x={1.2} y={1} width={CABIN.width - 2.4} height={4.6} rx={1} fill={colors.sceneWindow} />
        <Polygon points="1.8,1.3 4.8,1.3 6.6,5.3 3.6,5.3" fill={white} opacity={0.3} />
      </G>
      <Polygon points={cabinFaces.top} fill={colors.secondary} />
      <Polygon points={cabinFaces.top} fill={white} opacity={0.28} />

      {/* Mirror */}
      <Ellipse cx={-6} cy={-8.4} rx={1.4} ry={0.9} fill={colors.sceneCarShade} />
    </Svg>
  );
}

/**
 * @param {number[]} start Road start [x, y]
 * @param {Array} curves Road curves (see utils/pathSampler)
 */
export default function CityCar({ start, curves }) {
  const progress = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(progress, { toValue: 1, duration: DRIVE_MS, easing: Easing.linear, useNativeDriver: true }),
        Animated.delay(PAUSE_MS),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [progress]);

  // Turn the road points into animation steps: where the car is, and how much it turns with the road
  const { inputRange, translateX, translateY, rotate } = useMemo(() => {
    const points = samplePath(start, curves, SAMPLES_PER_CURVE);
    const last = points.length - 1;
    return {
      inputRange: points.map((_, index) => index / last),
      translateX: points.map((point) => point.x - CENTER_X),
      translateY: points.map((point) => point.y - CENTER_Y),
      rotate: points.map((point) => `${(point.angle - ISO_HEADING_DEG) * TURN_FACTOR}deg`),
    };
  }, [start, curves]);

  return (
    <Animated.View
      style={[
        styles.car,
        {
          opacity: progress.interpolate({ inputRange: [0, 0.04, 0.94, 1], outputRange: [0, 1, 1, 0] }),
          transform: [
            { translateX: progress.interpolate({ inputRange, outputRange: translateX }) },
            { translateY: progress.interpolate({ inputRange, outputRange: translateY }) },
            { rotate: progress.interpolate({ inputRange, outputRange: rotate }) },
          ],
        },
      ]}
    >
      <CarArt />
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  car: { position: 'absolute', transformOrigin: `${CENTER_X}px ${CENTER_Y}px` },
});

