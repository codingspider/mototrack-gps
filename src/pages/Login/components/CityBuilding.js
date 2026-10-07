// One isometric building (SVG): left, right and top faces, windows and an optional shop awning.
import React from 'react';
import { Polygon } from 'react-native-svg';
import { isoBoxFaces, isoWindows } from '../../../utils/isometric';
import { useAppTheme } from '../../../theme';

const AWNING_STRIPES = 4;

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
export default function CityBuilding({ x, y, w, d, h, cols, rows, hasAwning = false }) {
  const { colors } = useAppTheme();
  const faces = isoBoxFaces(x, y, w, d, h);
  const leftWindows = isoWindows('left', x, y, w, h, cols, rows);
  const rightWindows = isoWindows('right', x, y, d, h, Math.max(1, cols - 1), rows);

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
        points: `${x + u0},${y - u0 / 2 - v0} ${x + u1},${y - u1 / 2 - v0} ${x + u1},${y - u1 / 2 - v1} ${x + u0},${y - u0 / 2 - v1}`,
        fill: index % 2 === 0 ? colors.secondary : colors.sceneBuildingTop,
      });
    }
  }

  return (
    <>
      <Polygon points={faces.left} fill={colors.sceneBuildingLeft} />
      <Polygon points={faces.right} fill={colors.sceneBuildingRight} />
      <Polygon points={faces.top} fill={colors.sceneBuildingTop} />
      {leftWindows.map((points) => (
        <Polygon key={`l${points}`} points={points} fill={colors.sceneWindow} />
      ))}
      {rightWindows.map((points) => (
        <Polygon key={`r${points}`} points={points} fill={colors.sceneWindow} opacity={0.75} />
      ))}
      {awningStripes.map((stripe) => (
        <Polygon key={stripe.key} points={stripe.points} fill={stripe.fill} />
      ))}
    </>
  );
}
