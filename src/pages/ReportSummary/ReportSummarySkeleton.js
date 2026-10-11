// Loading placeholder for the report summary: the hero card and the grid of number cards.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function ReportSummarySkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={110} style={styles.block} />
      {[0, 1, 2].map((row) => (
        <View key={row} style={styles.row}>
          <Skeleton height={104} width="48.5%" style={styles.block} />
          <Skeleton height={104} width="48.5%" style={styles.block} />
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  block: { borderRadius: radius.lg },
});
