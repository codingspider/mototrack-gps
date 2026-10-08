// Placeholder for the summary cards and rows while a report loads (the filters stay visible).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function ReportSkeleton() {
  return (
    <View style={styles.container}>
      <View style={styles.row}>
        {[1, 2, 3].map((item) => (
          <Skeleton key={item} width="31%" height={64} style={styles.card} />
        ))}
      </View>
      {[1, 2, 3, 4].map((item) => (
        <Skeleton key={item} height={78} style={styles.card} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.sm },
  row: { flexDirection: 'row', justifyContent: 'space-between' },
  card: { borderRadius: radius.lg },
});
