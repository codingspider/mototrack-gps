// Loading placeholder for the Payments page: three cards the size of the real ones.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function PaymentsSkeleton() {
  return (
    <View style={styles.container}>
      <Skeleton height={380} style={styles.card} />
      <Skeleton height={230} style={styles.card} />
      <Skeleton height={200} style={styles.card} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.md },
  card: { borderRadius: radius.lg },
});
