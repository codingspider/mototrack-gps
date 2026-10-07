// Main button (built on Paper Button). Shows a spinner inside and is disabled while isLoading.
import React from 'react';
import { StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';
import { radius, spacing, useAppTheme } from '../../theme';

/**
 * @param {string} title
 * @param {function} onPress
 * @param {boolean} isLoading
 * @param {'primary'|'secondary'|'link'} variant secondary = red CTA, link = text only
 * @param {string} icon Paper icon name (MaterialCommunityIcons), optional
 * @param {boolean} isIconRight Put the icon after the title
 * @param {boolean} isCompact Smaller button (for cards)
 */
export default function AppButton({
  title,
  onPress,
  isLoading = false,
  isDisabled = false,
  variant = 'primary',
  icon,
  isIconRight = false,
  isCompact = false,
  style,
}) {
  const { colors } = useAppTheme();
  const isLink = variant === 'link';
  const buttonColor = variant === 'secondary' ? colors.secondary : colors.primary;

  return (
    <Button
      mode={isLink ? 'text' : 'contained'}
      onPress={onPress}
      loading={isLoading}
      disabled={isLoading || isDisabled}
      icon={icon}
      buttonColor={isLink ? undefined : buttonColor}
      textColor={isLink ? colors.primary : colors.textOnPrimary}
      style={[styles.button, style]}
      contentStyle={[styles.content, isCompact && styles.compact, isIconRight && styles.iconRight]}
      labelStyle={[styles.label, isCompact && styles.compactLabel]}
    >
      {title}
    </Button>
  );
}

const styles = StyleSheet.create({
  button: { borderRadius: radius.lg },
  content: { minHeight: 52, paddingHorizontal: spacing.lg },
  iconRight: { flexDirection: 'row-reverse' },
  label: { fontSize: 16, fontWeight: '800' },
  compact: { minHeight: 40 },
  compactLabel: { fontSize: 14 },
});
