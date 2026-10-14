// A row of digit boxes like a car odometer, with a small caption above it. Shows dashes while the distance is unknown.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import AppText from '../../../components/common/AppText';
import { getOdometerDigits } from '../../../utils/odometer';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { alignItems: 'center', gap: spacing.xs },
    caption: { fontWeight: '700', letterSpacing: 0.3 },
    row: { flexDirection: 'row', gap: 2 },
    box: {
      width: 13,
      height: 22,
      borderRadius: radius.sm,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: colors.primaryLight,
      borderWidth: 1,
      borderColor: colors.primaryBorder,
    },
    decimalBox: { backgroundColor: colors.primary, borderColor: colors.primary },
    digit: { fontWeight: '800', fontSize: 12 },
    unit: { fontWeight: '700' },
  });

/**
 * @param {string} caption Words above the boxes, e.g. "Total km"
 * @param {number|null} value Distance in km, null while it is not known
 * @param {number} integerDigits Boxes before the decimal point
 * @param {number} decimalDigits Boxes after it (drawn in the primary color)
 */
export default function OdometerBox({ caption, value, integerDigits, decimalDigits = 0 }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const digits = getOdometerDigits(value, integerDigits, decimalDigits);
  const boxes = digits || Array.from({ length: integerDigits + decimalDigits }, (unused, index) => ({
    char: '-',
    isDecimal: index >= integerDigits,
  }));

  return (
    <View style={styles.wrapper}>
      <AppText variant="caption" color={colors.textSecondary} style={styles.caption} numberOfLines={1}>
        {caption}
      </AppText>
      <View style={styles.row}>
        {boxes.map((digit, index) => (
          <View key={index} style={[styles.box, digit.isDecimal && styles.decimalBox]}>
            <AppText style={styles.digit} color={digit.isDecimal ? colors.textOnPrimary : colors.text}>
              {digit.char}
            </AppText>
          </View>
        ))}
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.unit}>
        km
      </AppText>
    </View>
  );
}
