// Temporary screen for tabs that are built in a later step.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../components/common/AppText';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.background,
      padding: spacing.xl,
    },
  });

export default function PlaceholderPage({ title }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.container}>
      <AppText variant="subtitle">{title}</AppText>
      <AppText color={colors.textSecondary}>Coming soon</AppText>
    </View>
  );
}
