// Temporary screen for tabs that are built in a later step.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../components/common/AppText';
import { colors, spacing } from '../../theme';

export default function PlaceholderPage({ title }) {
  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText color={colors.textSecondary}>Coming soon</AppText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.background,
    padding: spacing.xl,
  },
});