// One place box (From or To): shows the chosen place, or lets the customer type to search for one.
import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { Icon, IconButton } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      paddingLeft: spacing.md,
      borderRadius: radius.md,
      borderWidth: 1,
      borderColor: colors.border,
      backgroundColor: colors.background,
    },
    label: { width: 40 },
    input: { flex: 1, color: colors.text, paddingVertical: spacing.sm },
    fixed: { flex: 1, paddingVertical: spacing.sm },
  });

/**
 * @param {string} label "From" or "To"
 * @param {string} icon Paper icon name
 * @param {string} value The text in the box
 * @param {function} onChangeText Typing (omit for a fixed place)
 * @param {function} onFocus
 * @param {function} onClear Shows an X button when given
 * @param {string} placeholder
 * @param {boolean} isFixed A place that cannot be typed over (the vehicle)
 * @param {string} subtitle A smaller line under a fixed place (the vehicle's current address)
 */
export default function PlaceField({ label, icon, value, onChangeText, onFocus, onClear, placeholder, isFixed = false, subtitle }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <View style={styles.row}>
      <Icon source={icon} size={20} color={colors.primary} />
      <AppText variant="caption" color={colors.textSecondary} style={styles.label}>
        {label}
      </AppText>
      {isFixed ? (
        <View style={styles.fixed}>
          <AppText numberOfLines={1}>{value}</AppText>
          {!!subtitle && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {subtitle}
            </AppText>
          )}
        </View>
      ) : (
        <TextInput
          value={value}
          onChangeText={onChangeText}
          onFocus={onFocus}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          style={styles.input}
          autoCorrect={false}
        />
      )}
      {!isFixed && !!onClear && !!value && (
        <IconButton icon="close" size={18} iconColor={colors.textSecondary} onPress={onClear} accessibilityLabel="Clear" />
      )}
    </View>
  );
}
