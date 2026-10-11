// "Export report" bar with PDF and Excel buttons. The server has no export endpoint yet, so the buttons say so.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.md },
    text: { flex: 1 },
    button: { borderRadius: radius.md, backgroundColor: colors.primaryLight },
    buttonContent: { alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.md },
    label: { fontWeight: '700' },
  });

/**
 * @param {string} caption e.g. "Trip summary · 11 Oct 2026"
 * @param {function} onExport Called with 'PDF' or 'Excel'
 */
export default function ExportRow({ caption, onExport }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  const renderButton = (label, icon) => (
    <TouchableRipple borderless style={styles.button} onPress={() => onExport(label)}>
      <View style={styles.buttonContent}>
        <Icon source={icon} size={20} color={colors.primary} />
        <AppText variant="caption" color={colors.primary} style={styles.label}>
          {label}
        </AppText>
      </View>
    </TouchableRipple>
  );

  return (
    <Card style={styles.card}>
      <Icon source="file-document-outline" size={26} color={colors.textSecondary} />
      <View style={styles.text}>
        <AppText>Export report</AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {caption}
        </AppText>
      </View>
      {renderButton('PDF', 'file-pdf-box')}
      {renderButton('Excel', 'file-excel-outline')}
    </Card>
  );
}
