// One row of the profile menu: round icon, title (and a line under it), then a chevron, a switch or a value.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, Switch, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    iconCircle: {
      width: 38,
      height: 38,
      borderRadius: radius.round,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
  });

/**
 * @param {string} icon Paper icon name
 * @param {string} title
 * @param {string} subtitle Optional line under the title
 * @param {function} onPress Makes the row tappable (shows a chevron unless `rightText` or `onToggle` is given)
 * @param {string} rightText Text on the right (e.g. the app version)
 * @param {boolean} isOn With `onToggle`: shows a switch instead of a chevron
 * @param {function} onToggle Called when the switch is flipped
 * @param {string} chevronIcon Replace the chevron (e.g. "chevron-down" for an open section)
 * @param {boolean} isDanger Red icon and title (for "Delete my account")
 */
export default function MenuRow({
  icon,
  title,
  subtitle,
  onPress,
  rightText,
  isOn,
  onToggle,
  chevronIcon = 'chevron-right',
  isDanger = false,
}) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const hasSwitch = typeof onToggle === 'function';

  const content = (
    <View style={styles.row}>
      <View style={styles.iconCircle}>
        <Icon source={icon} size={20} color={isDanger ? colors.secondary : colors.primary} />
      </View>
      <View style={styles.text}>
        <AppText color={isDanger ? colors.secondary : undefined}>{title}</AppText>
        {!!subtitle && (
          <AppText variant="caption" color={colors.textSecondary}>
            {subtitle}
          </AppText>
        )}
      </View>
      {hasSwitch && <Switch value={!!isOn} onValueChange={onToggle} color={colors.primary} />}
      {!!rightText && <AppText color={colors.textSecondary}>{rightText}</AppText>}
      {!hasSwitch && !rightText && !!onPress && <Icon source={chevronIcon} size={22} color={colors.textSecondary} />}
    </View>
  );

  if (!onPress) {
    return content;
  }
  return <TouchableRipple onPress={onPress}>{content}</TouchableRipple>;
}
