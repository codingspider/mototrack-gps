// The three download buttons under a report table: PDF, Excel (.xlsx) and CSV. The one being made shows a spinner.
// Made to always show the whole word: small side padding, a small bold font, and a font that shrinks to fit when a
// phone has a large text size or a narrow screen.
import React from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme } from '../../../theme';

const BUTTONS = [
  ['pdf', 'PDF', 'file-pdf-box'],
  ['xlsx', 'Excel', 'file-excel'],
  ['csv', 'CSV', 'file-delimited'],
];

const ICON_SIZE = 18;
const MIN_FONT_SCALE = 0.6; // the word may shrink to 60% of its size before it would be cut

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: spacing.sm },
  button: { flex: 1, borderRadius: radius.round },
  dimmed: { opacity: 0.5 }, // the other buttons while one file is being made
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    minHeight: 40,
    paddingHorizontal: spacing.xs,
  },
  // flexShrink lets the word take what is left of the button after the icon, then it scales down to fit
  label: { flexShrink: 1, fontWeight: '800', fontSize: 14 },
});

/**
 * @param {function} onExport Called with 'pdf' | 'xlsx' | 'csv'
 * @param {string} busyFormat The format being made now ('' when none); every button is disabled meanwhile
 */
export default function ExportButtons({ onExport, busyFormat = '' }) {
  const { colors } = useAppTheme();

  return (
    <View style={styles.row}>
      {BUTTONS.map(([format, title, icon]) => {
        const isBusy = busyFormat === format;
        const isDisabled = !!busyFormat;
        const backgroundColor = format === 'pdf' ? colors.secondary : colors.primary;
        return (
          <TouchableRipple
            key={format}
            borderless
            disabled={isDisabled}
            onPress={() => onExport(format)}
            accessibilityLabel={title}
            style={[styles.button, { backgroundColor }, isDisabled && !isBusy && styles.dimmed]}
          >
            <View style={styles.content}>
              {isBusy ? (
                <ActivityIndicator size="small" color={colors.textOnPrimary} />
              ) : (
                <Icon source={icon} size={ICON_SIZE} color={colors.textOnPrimary} />
              )}
              <AppText
                color={colors.textOnPrimary}
                style={styles.label}
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={MIN_FONT_SCALE}
              >
                {title}
              </AppText>
            </View>
          </TouchableRipple>
        );
      })}
    </View>
  );
}
