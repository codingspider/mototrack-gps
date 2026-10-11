// Loading placeholder for the Alerts list: a few alert-sized cards.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing } from '../../theme';

export default function NotificationsSkeleton() {
  return (
    <View style={styles.container}>
      {[0, 1, 2, 3, 4, 5].map((index) => (
        <Skeleton key={index} height={88} style={styles.block} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.md, gap: spacing.sm },
  block: { borderRadius: radius.md },
});
