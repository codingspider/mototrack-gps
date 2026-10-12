// One isometric building (SVG): left, right and top faces, windows and an optional shop awning.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing } from 'react-native';
import { Polygon } from 'react-native-svg';
import { isoBoxFaces, isoWindows } from '../../../utils/isometric';
import { useAppTheme } from '../../../theme';

const AWNING_STRIPES = 4;
const AnimatedPolygon = Animated.createAnimatedComponent(Polygon);
const GLOW_LOW = 0.25;
const GLOW_HIGH = 0.8;

/**
 * @param {number} x Front-bottom corner x
 * @param {number} y Front-bottom corner y
 * @param {number} w Width along the left face
 * @param {number} d Depth along the right face
 * @param {number} h Height
 * @param {number} cols Window columns on the left face
 * @param {number} rows Window rows
 * @param {boolean} hasAwning Red and white shop awning on the right face
 */
export default function CityBuilding({
  x,
  y,
  w,
  d,
  h,
  cols,
  rows,
  hasAwning = false,
}) {
  const { colors, isDark } = useAppTheme();
  const glow = useRef(new Animated.Value(GLOW_LOW)).current;

  // At night the windows light up and their glow breathes (each building at its own pace).
  // SVG props cannot use the native driver, so this runs on the JS side: only a few polygons per building.
  useEffect(() => {
    if (!isDark) {
      return undefined;
    }
    const duration = 1300 + (x % 7) * 180;
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(glow, {
          toValue: GLOW_HIGH,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
        Animated.timing(glow, {
          toValue: GLOW_LOW,
          duration,
          easing: Easing.inOut(Easing.sin),
          useNativeDriver: false,
        }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [glow, isDark, x]);

  const faces = isoBoxFaces(x, y, w, d, h);
  const leftWindows = isoWindows('left', x, y, w, h, cols, rows);
  const rightWindows = isoWindows(
    'right',
    x,
    y,
    d,
    h,
    Math.max(1, cols - 1),
    rows,
  );

  // Awning: a band of alternating stripes across the lower part of the right face
  const awningStripes = [];
  if (hasAwning) {
    const stripeWidth = (d * 0.7) / AWNING_STRIPES;
    for (let index = 0; index < AWNING_STRIPES; index += 1) {
      const u0 = d * 0.15 + index * stripeWidth;
      const u1 = u0 + stripeWidth;
      const v0 = h * 0.36;
      const v1 = h * 0.5;
      awningStripes.push({
        key: index,
        points: `${x + u0},${y - u0 / 2 - v0} ${x + u1},${y - u1 / 2 - v0} ${
          x + u1
        },${y - u1 / 2 - v1} ${x + u0},${y - u0 / 2 - v1}`,
        fill: index % 2 === 0 ? colors.secondary : colors.sceneBuildingTop,
      });
    }
  }

  return (
    <>
      <Polygon points={faces.left} fill={colors.sceneBuildingLeft} />
      <Polygon points={faces.right} fill={colors.sceneBuildingRight} />
      <Polygon points={faces.top} fill={colors.sceneBuildingTop} />
      {isDark &&
        [...leftWindows, ...rightWindows].map(points => (
          <AnimatedPolygon
            key={`g${points}`}
            points={points}
            fill={colors.sceneWindowGlow}
            stroke={colors.sceneWindowGlow}
            strokeWidth={3}
            opacity={glow}
          />
        ))}
      {leftWindows.map(points => (
        <Polygon key={`l${points}`} points={points} fill={colors.sceneWindow} />
      ))}
      {rightWindows.map(points => (
        <Polygon
          key={`r${points}`}
          points={points}
          fill={colors.sceneWindow}
          opacity={0.75}
        />
      ))}
      {awningStripes.map(stripe => (
        <Polygon key={stripe.key} points={stripe.points} fill={stripe.fill} />
      ))}
    </>
  );
}
