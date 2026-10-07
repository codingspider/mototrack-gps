// Text input (built on Paper TextInput) with an optional left icon, right icon and error line.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { HelperText, TextInput } from 'react-native-paper';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { marginBottom: spacing.md },
    input: { backgroundColor: colors.primaryInputBg },
    outline: { borderRadius: radius.md, borderWidth: 1.5 },
  });

/**
 * @param {string} label Floating label (optional, use placeholder for the compact look)
 * @param {string} error Error text shown under the input
 * @param {string} icon Left icon name (MaterialCommunityIcons)
 * @param {string} rightIcon Right icon name, e.g. an eye to show the password
 * @param {function} onRightIconPress
 */
export default function AppInput({ label, error, icon, rightIcon, onRightIconPress, style, ...rest }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const hasError = !!error;

  return (
    <View style={styles.wrapper}>
      <TextInput
        mode="outlined"
        label={label}
        error={hasError}
        outlineColor={colors.primaryInputBorder}
        activeOutlineColor={colors.primary}
        outlineStyle={styles.outline}
        placeholderTextColor={colors.textSecondary}
        textColor={colors.text}
        left={icon ? <TextInput.Icon icon={icon} color={colors.textSecondary} /> : undefined}
        right={
          rightIcon ? (
            <TextInput.Icon icon={rightIcon} color={colors.textSecondary} onPress={onRightIconPress} />
          ) : undefined
        }
        autoCapitalize="none"
        style={[styles.input, style]}
        {...rest}
      />
      {hasError && <HelperText type="error">{error}</HelperText>}
    </View>
  );
}
