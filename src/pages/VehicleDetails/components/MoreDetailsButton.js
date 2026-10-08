// Bar under the action grid that opens the details drawer.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    button: { borderRadius: radius.md, backgroundColor: colors.surface, elevation: 1 },
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.sm },
    label: { fontWeight: '700' },
  });

export default function MoreDetailsButton({ onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <TouchableRipple borderless style={styles.button} onPress={onPress}>
      <View style={styles.row}>
        <Icon source="chevron-up" size={20} color={colors.primary} />
        <AppText color={colors.primary} style={styles.label}>
          More details
        </AppText>
      </View>
    </TouchableRipple>
  );
}
