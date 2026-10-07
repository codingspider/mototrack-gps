// Placeholder for the info cards while the vehicle details load (the map shows straight away).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Card from '../../components/common/Card';
import Skeleton from '../../components/skeleton/Skeleton';
import { spacing } from '../../theme';

export default function VehicleDetailsSkeleton() {
  return (
    <View style={styles.container}>
      {[1, 2, 3].map((item) => (
        <Card key={item}>
          <Skeleton width={140} height={20} style={styles.gap} />
          <Skeleton height={16} style={styles.gap} />
          <Skeleton height={16} style={styles.gap} />
          <Skeleton width="70%" height={16} />
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { gap: spacing.md },
  gap: { marginBottom: spacing.md },
});
