// Text with theme styles (built on Paper Text). variant: title | subtitle | body | caption.
import React from 'react';
import { Text } from 'react-native-paper';
import { typography, useAppTheme } from '../../theme';

export default function AppText({ variant = 'body', color, style, children, ...rest }) {
  const { colors } = useAppTheme();
  return (
    <Text style={[typography[variant], { color: color || colors.text }, style]} {...rest}>
      {children}
    </Text>
  );
}
