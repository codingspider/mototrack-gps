// Loading placeholder for the Vehicles list: a search box, chips and a few rows.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function VehiclesSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={44} style={styles.block} />
      <Skeleton height={32} width="70%" style={styles.block} />
      {[0, 1, 2, 3, 4].map((index) => (
        <Skeleton key={index} height={84} style={styles.block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm },
  block: { borderRadius: radius.md },
});
