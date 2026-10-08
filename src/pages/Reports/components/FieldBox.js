// A filter field: small label above the chosen value, with a down arrow. Tap it to change the value.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    // flex: 1 makes a field fill its row, whether it is alone or next to another one
    box: { flex: 1, borderRadius: radius.md, borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background },
    row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.sm },
    text: { flex: 1 },
    value: { fontWeight: '700' },
  });

/**
 * @param {string} label Small text above
 * @param {string} text The chosen value
 * @param {function} onPress
 */
export default function FieldBox({ label, text, onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <TouchableRipple borderless onPress={onPress} style={styles.box}>
      <View style={styles.row}>
        <View style={styles.text}>
          <AppText variant="caption" color={colors.textSecondary}>
            {label}
          </AppText>
          <AppText style={styles.value} numberOfLines={1}>
            {text}
          </AppText>
        </View>
        <Icon source="chevron-down" size={20} color={colors.textSecondary} />
      </View>
    </TouchableRipple>
  );
}
