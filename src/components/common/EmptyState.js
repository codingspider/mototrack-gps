// Friendly "nothing here" message.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import { spacing, useAppTheme } from '../../theme';

export default function EmptyState({ text }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <AppText color={colors.textSecondary}>{text}</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: 'center' },
});
