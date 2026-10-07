// White rounded card with a soft shadow (Paper Surface). Pass onPress to make it tappable.
import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';
import { colors, radius, spacing } from '../../theme';

export default function Card({ style, onPress, children }) {
  return (
    <Surface elevation={1} style={[styles.card, style]}>
      {onPress ? (
        <TouchableRipple onPress={onPress} borderless style={styles.ripple}>
          {children}
        </TouchableRipple>
      ) : (
        children
      )}
    </Surface>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.surface,
    borderRadius: radius.md,
    padding: spacing.lg,
  },
  ripple: { borderRadius: radius.md },
});
