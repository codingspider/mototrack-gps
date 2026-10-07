// Text with theme styles (built on Paper Text). variant: title | subtitle | body | caption.
import React from 'react';
import { Text } from 'react-native-paper';
import { colors, typography } from '../../theme';

export default function AppText({ variant = 'body', color = colors.text, style, children, ...rest }) {
  return (
    <Text style={[typography[variant], { color }, style]} {...rest}>
      {children}
    </Text>
  );
}
