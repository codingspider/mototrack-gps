// Friendly error message with a Retry button.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from './AppText';
import AppButton from './AppButton';
import { spacing, useAppTheme } from '../../theme';

export default function ErrorState({ message, onRetry }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.container}>
      <AppText color={colors.textSecondary} style={styles.message}>
        {message}
      </AppText>
      <AppButton title="Retry" onPress={onRetry} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: spacing.xl, alignItems: 'center' },
  message: { marginBottom: spacing.lg, textAlign: 'center' },
});
