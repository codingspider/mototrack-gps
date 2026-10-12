// "Speed Trend": a line chart of max speed over time, one line per vehicle (or max / avg / min for one vehicle).
// Drawn with react-native-svg, so it needs no chart library. A gap in the readings breaks the line.
import React, { useState } from 'react';
import { StyleSheet, View } from 'react-native';
import Svg, { Line, Polyline, Text as SvgText } from 'react-native-svg';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { buildSegments, niceMax, tickIndexes } from '../../../utils/speedReport';
import { radius, spacing, useAppTheme } from '../../../theme';

const CHART_HEIGHT = 200;
const PAD = { left: 34, right: 8, top: 10, bottom: 24 };
const GRID_LINES = 4;
const MAX_LEGEND = 8;

/**
 * @param {{ labels: string[], datasets: Array<{ label: string, data: Array<number|null> }> }} chart
 * @param {string} bucketLabel e.g. "1 minute", shown as "Max speed per 1 minute"
 */
export default function SpeedChart({ chart, bucketLabel }) {
  const { colors } = useAppTheme();
  const [width, setWidth] = useState(0);
  const palette = [colors.secondary, colors.info, colors.statusOnline, colors.accent, colors.primary, colors.textSecondary];

  const { labels, datasets } = chart;
  const topValue = niceMax(Math.max(0, ...datasets.map((set) => Math.max(0, ...set.data.map((value) => Number(value) || 0)))));
  const plotW = Math.max(width - PAD.left - PAD.right, 1);
  const plotH = CHART_HEIGHT - PAD.top - PAD.bottom;
  const xOf = (index) => PAD.left + (labels.length > 1 ? (index / (labels.length - 1)) * plotW : plotW / 2);
  const yOf = (value) => PAD.top + plotH - (value / topValue) * plotH;

  const grid = [];
  for (let step = 0; step <= GRID_LINES; step += 1) {
    grid.push((topValue / GRID_LINES) * step);
  }

  return (
    <Card style={styles.card}>
      <View style={styles.header}>
        <Icon source="chart-line" size={22} color={colors.secondary} />
        <AppText variant="subtitle" style={styles.title}>
          Speed Trend
        </AppText>
      </View>
      {!!bucketLabel && (
        <AppText variant="caption" color={colors.textSecondary}>
          {`Max speed per ${bucketLabel}`}
        </AppText>
      )}

      <View style={styles.legend}>
        {datasets.slice(0, MAX_LEGEND).map((set, index) => (
          <View key={set.label} style={styles.legendItem}>
            <View style={[styles.dot, { backgroundColor: palette[index % palette.length] }]} />
            <AppText variant="caption" numberOfLines={1}>
              {set.label}
            </AppText>
          </View>
        ))}
        {datasets.length > MAX_LEGEND && (
          <AppText variant="caption" color={colors.textSecondary}>
            {`+${datasets.length - MAX_LEGEND} more`}
          </AppText>
        )}
      </View>

      <View onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
        {width > 0 && (
          <Svg width={width} height={CHART_HEIGHT}>
            {grid.map((value) => (
              <React.Fragment key={value}>
                <Line x1={PAD.left} x2={width - PAD.right} y1={yOf(value)} y2={yOf(value)} stroke={colors.border} strokeWidth={1} />
                <SvgText x={PAD.left - 6} y={yOf(value) + 3} fontSize={9} fill={colors.textSecondary} textAnchor="end">
                  {Math.round(value)}
                </SvgText>
              </React.Fragment>
            ))}
            {tickIndexes(labels.length).map((index) => (
              <SvgText key={index} x={xOf(index)} y={CHART_HEIGHT - 8} fontSize={9} fill={colors.textSecondary} textAnchor="middle">
                {labels[index]}
              </SvgText>
            ))}
            {datasets.map((set, setIndex) =>
              buildSegments(set.data).map((segment) => (
                <Polyline
                  key={`${set.label}-${segment[0].index}`}
                  points={segment.map((point) => `${xOf(point.index)},${yOf(point.value)}`).join(' ')}
                  fill="none"
                  stroke={palette[setIndex % palette.length]}
                  strokeWidth={1.6}
                  strokeLinejoin="round"
                />
              )),
            )}
          </Svg>
        )}
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.axis}>
        Time · speed in km/h
      </AppText>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { padding: spacing.md, gap: spacing.xs },
  header: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  title: { fontWeight: '800' },
  legend: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginVertical: spacing.xs },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs, maxWidth: '48%' },
  dot: { width: 10, height: 10, borderRadius: radius.round },
  axis: { textAlign: 'center' },
});
