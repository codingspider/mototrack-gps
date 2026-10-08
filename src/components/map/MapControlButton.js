// Round button that floats on the map. Filled with the primary color while its feature is on.
import React from 'react';
import { StyleSheet } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    button: { margin: 0, elevation: 3, shadowColor: colors.shadow },
  });

/**
 * @param {string} icon Paper icon name
 * @param {string} label Screen reader label
 * @param {boolean} isActive Feature is on
 * @param {function} onPress
 */
export default function MapControlButton({ icon, label, isActive = false, onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <IconButton
      icon={icon}
      size={22}
      iconColor={isActive ? colors.textOnPrimary : colors.primary}
      containerColor={isActive ? colors.primary : colors.surface}
      style={styles.button}
      accessibilityLabel={label}
      onPress={onPress}
    />
  );
}
