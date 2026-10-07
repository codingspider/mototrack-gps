// One titled card with label / value rows (live status, location, device...).
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    title: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm, gap: spacing.sm },
    row: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingVertical: spacing.sm,
      borderTopWidth: StyleSheet.hairlineWidth,
      borderTopColor: colors.border,
    },
    label: { flex: 2 },
    value: { flex: 3, textAlign: 'right', fontWeight: '700' },
  });

/**
 * @param {string} title Section title
 * @param {string} icon Paper icon name
 * @param {Array<{label: string, value: string}>} rows
 */
export default function DetailSection({ title, icon, rows }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <Card>
      <View style={styles.title}>
        <Icon source={icon} size={20} color={colors.primary} />
        <AppText variant="subtitle">{title}</AppText>
      </View>
      {rows.map((item) => (
        <View key={item.label} style={styles.row}>
          <AppText color={colors.textSecondary} style={styles.label}>
            {item.label}
          </AppText>
          <AppText style={styles.value}>{item.value}</AppText>
        </View>
      ))}
    </Card>
  );
}
