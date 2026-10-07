// Rounded card with a soft shadow (Paper Surface). Pass onPress to make it tappable.
import React from 'react';
import { StyleSheet } from 'react-native';
import { Surface, TouchableRipple } from 'react-native-paper';
import { radius, spacing, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: {
      backgroundColor: colors.surface,
      borderRadius: radius.md,
      padding: spacing.lg,
    },
    ripple: { borderRadius: radius.md },
  });

export default function Card({ style, onPress, children }) {
  const styles = useThemedStyles(makeStyles);

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
