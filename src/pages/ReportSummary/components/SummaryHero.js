// The big colored card at the top: the distance of the range, with a little line that rises with every trip.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Polyline } from 'react-native-svg';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const GRAPH_HEIGHT = 56;
const GRAPH_PADDING = 6;

const makeStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: spacing.lg,
      borderRadius: radius.lg,
      backgroundColor: colors.primary,
      elevation: 4,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    left: { flexShrink: 0, gap: spacing.xs },
    value: { fontSize: 38, lineHeight: 44, fontWeight: '800' },
    unit: { fontSize: 20, fontWeight: '700' },
    graph: { flex: 1, height: GRAPH_HEIGHT, marginLeft: spacing.lg, justifyContent: 'center' },
  });

/** Points of the line for a list of running totals, scaled into the box. */
function toPoints(series, width) {
  const innerWidth = Math.max(width - GRAPH_PADDING * 2, 1);
  const innerHeight = GRAPH_HEIGHT - GRAPH_PADDING * 2;
  if (series.length < 2) {
    // Nothing to compare yet: a flat line along the bottom
    return `${GRAPH_PADDING},${GRAPH_HEIGHT - GRAPH_PADDING} ${GRAPH_PADDING + innerWidth},${GRAPH_HEIGHT - GRAPH_PADDING}`;
  }
  const max = Math.max(...series, 1);
  return series
    .map((value, index) => {
      const x = GRAPH_PADDING + (index / (series.length - 1)) * innerWidth;
      const y = GRAPH_PADDING + innerHeight - (value / max) * innerHeight;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');
}

/**
 * @param {string|null} distanceKm e.g. "672.3" (null while unknown)
 * @param {string} caption e.g. "Distance · Today"
 * @param {number[]} series Running total of the trips' distance
 */
export default function SummaryHero({ distanceKm, caption, series }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [graphWidth, setGraphWidth] = useState(0);

  return (
    <View style={styles.card}>
      <View style={styles.left}>
        <AppText color={colors.textOnPrimary} style={styles.value}>
          {distanceKm ?? '-'}
          <AppText color={colors.textOnPrimary} style={styles.unit}>
            {' km'}
          </AppText>
        </AppText>
        <AppText variant="caption" color={colors.textOnPrimary}>
          {caption}
        </AppText>
      </View>
      <View style={styles.graph} onLayout={(event) => setGraphWidth(event.nativeEvent.layout.width)}>
        {graphWidth > 0 && (
          <Svg width={graphWidth} height={GRAPH_HEIGHT}>
            <Polyline
              points={toPoints(series, graphWidth)}
              fill="none"
              stroke={colors.textOnPrimary}
              strokeWidth={3}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        )}
      </View>
    </View>
  );
}
