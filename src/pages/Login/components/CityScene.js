// The animated isometric city for the Login header: road, buildings, billboard, swaying trees,
// a bouncing map pin and a car that drives from the pin down the road. Drawn with react-native-svg.
// All positions are in a 390 x 270 drawing space; the parent scales it to the screen width.
import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import Svg, { Circle, Ellipse, G, Path, Rect, Text as SvgText } from 'react-native-svg';
import { buildPathData } from '../../../utils/pathSampler';
import { useAppTheme } from '../../../theme';
import CityBuilding from './CityBuilding';
import CityCar from './CityCar';
import CityTree from './CityTree';

export const SCENE_WIDTH = 390;
export const SCENE_HEIGHT = 270;

// The road: starts at the map pin, winds forward past the shop and off the front of the scene
const ROAD_START = [58, 114];
// Gentle bends only, and the road keeps to the 2:1 slope of the isometric buildings
const ROAD_CURVES = [
  { c1: [90, 116], c2: [110, 142], end: [150, 162] },
  { c1: [190, 182], c2: [225, 196], end: [268, 218] },
  { c1: [300, 234], c2: [325, 244], end: [352, 254] },
];
const ROAD_PATH = buildPathData(ROAD_START, ROAD_CURVES);

const PIN_BOUNCE = 6;

function MapPin() {
  const { colors } = useAppTheme();
  const bounce = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(bounce, { toValue: 1, duration: 650, easing: Easing.out(Easing.quad), useNativeDriver: true }),
        Animated.timing(bounce, { toValue: 0, duration: 650, easing: Easing.in(Easing.quad), useNativeDriver: true }),
      ]),
    );
    animation.start();
    return () => animation.stop();
  }, [bounce]);

  return (
    <Animated.View
      style={[
        styles.pin,
        { transform: [{ translateY: bounce.interpolate({ inputRange: [0, 1], outputRange: [0, -PIN_BOUNCE] }) }] },
      ]}
    >
      <Svg width={30} height={44} viewBox="0 0 30 44">
        <Path d="M15 42C15 42 3 26 3 15a12 12 0 1 1 24 0C27 26 15 42 15 42Z" fill={colors.secondary} />
        <Circle cx={15} cy={15} r={5} fill={colors.textOnPrimary} />
      </Svg>
    </Animated.View>
  );
}

function Billboard() {
  const { colors } = useAppTheme();
  // The panel faces front-left, so its text is slanted to follow the face
  return (
    <G>
      <Rect x={322} y={112} width={6} height={44} fill={colors.sceneRoadEdge} />
      <G transform="translate(280 86) matrix(1 0.5 0 1 0 0)">
        <Rect x={0} y={-50} width={90} height={50} fill={colors.surface} stroke={colors.sceneBuildingLeft} strokeWidth={2} />
        <Circle cx={13} cy={-25} r={9} fill={colors.secondary} />
        <SvgText x={13} y={-21.5} fontSize={11} fontWeight="bold" fill={colors.textOnPrimary} textAnchor="middle">
          M
        </SvgText>
        <SvgText x={27} y={-27} fontSize={9.4} fontWeight="bold" fill={colors.info}>
          MOTOTRACK
        </SvgText>
        <SvgText x={27} y={-14} fontSize={11} fontWeight="bold" fill={colors.secondary}>
          GPS
        </SvgText>
      </G>
    </G>
  );
}

export default function CityScene() {
  const { colors } = useAppTheme();
  return (
    <View style={styles.scene}>
      <Svg width={SCENE_WIDTH} height={SCENE_HEIGHT} style={StyleSheet.absoluteFill}>
        {/* Ground and road */}
        <Path
          d="M-10 150 L110 94 L215 142 L300 104 L400 138 L400 280 L-10 280 Z"
          fill={colors.sceneGround}
          stroke={colors.sceneGroundShade}
          strokeWidth={3}
        />
        <Path d={ROAD_PATH} stroke={colors.sceneRoadEdge} strokeWidth={34} strokeLinecap="round" fill="none" />
        <Path d={ROAD_PATH} stroke={colors.sceneRoad} strokeWidth={29} strokeLinecap="round" fill="none" />
        <Path
          d={ROAD_PATH}
          stroke={colors.textOnPrimary}
          opacity={0.85}
          strokeWidth={2}
          strokeDasharray="8 8"
          strokeLinecap="round"
          fill="none"
        />
        <Ellipse cx={58} cy={116} rx={14} ry={5} fill={colors.sceneGroundShade} />

        {/* Buildings, back to front so nearer ones cover farther ones */}
        <CityBuilding x={108} y={112} w={26} d={26} h={40} cols={2} rows={3} />
        <CityBuilding x={160} y={118} w={34} d={34} h={62} cols={3} rows={5} />
        <CityBuilding x={232} y={130} w={22} d={22} h={84} cols={2} rows={7} />
        <Billboard />
        <CityBuilding x={262} y={190} w={40} d={36} h={34} cols={3} rows={2} hasAwning />
      </Svg>

      <MapPin />

      {/* Trees stand beside the road, never on it, so the car never drives under one */}
      <CityTree x={26} y={176} size={1.35} delay={0} duration={2800} />
      <CityTree x={62} y={206} size={1.05} delay={500} duration={2300} />
      <CityTree x={136} y={134} size={0.75} delay={900} duration={2600} />
      <CityTree x={196} y={152} size={0.65} delay={300} duration={2400} />
      <CityTree x={205} y={238} size={0.85} delay={1200} duration={3000} />
      <CityTree x={352} y={176} size={0.75} delay={700} duration={2500} />

      <CityCar start={ROAD_START} curves={ROAD_CURVES} />
    </View>
  );
}

const styles = StyleSheet.create({
  scene: { position: 'absolute', left: 0, top: 0, width: SCENE_WIDTH, height: SCENE_HEIGHT },
  pin: { position: 'absolute', left: 58 - 15, top: 114 - 42 },
});

