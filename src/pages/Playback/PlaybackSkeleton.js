// Placeholder for the player panel while the route loads (the filters and the map frame show straight away).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function PlaybackSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        <Skeleton width={90} height={28} style={styles.round} />
        <Skeleton width={110} height={28} />
        <Skeleton width={90} height={28} style={styles.round} />
      </View>
      <Skeleton height={8} style={styles.round} />
      <View style={styles.center}>
        <Skeleton width={72} height={72} style={styles.round} />
      </View>
      <View style={styles.row}>
        {[1, 2, 3, 4].map((item) => (
          <Skeleton key={item} width="23%" height={80} />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.lg, padding: spacing.lg },
  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  center: { alignItems: 'center' },
  round: { borderRadius: radius.round },
});
