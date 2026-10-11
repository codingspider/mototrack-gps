// Loading placeholder for the geofence list: a title line and a few rows.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function GeofencesSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={20} width="50%" />
      {[0, 1, 2, 3].map((index) => (
        <Skeleton key={index} height={72} style={styles.block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm },
  block: { borderRadius: radius.md },
});
