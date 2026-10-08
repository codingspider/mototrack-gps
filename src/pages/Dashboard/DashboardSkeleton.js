// Placeholder with the same layout as the Dashboard while the first load runs.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Skeleton from '../../components/skeleton/Skeleton';
import { radius, spacing, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingBottom: spacing.md,
      backgroundColor: colors.surface,
    },
    content: { padding: spacing.lg, gap: spacing.md },
    banner: { borderRadius: radius.lg },
    grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
    tile: { borderRadius: radius.md },
  });

export default function DashboardSkeleton() {
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  return (
    <View style={styles.screen}>
      <View style={[styles.header, { paddingTop: insets.top + spacing.sm }]}>
        <Skeleton width={162} height={52} />
        <Skeleton width={130} height={40} />
      </View>
      <View style={styles.content}>
        <Skeleton height={165} style={styles.banner} />
        <View style={styles.grid}>
          {[1, 2, 3, 4, 5, 6].map((item) => (
            <Skeleton key={item} width="32%" height={64} style={styles.tile} />
          ))}
        </View>
        <Skeleton height={64} style={styles.tile} />
        <Skeleton width={180} height={22} />
        <Skeleton height={64} style={styles.tile} />
        <Skeleton height={64} style={styles.tile} />
      </View>
    </View>
  );
}
