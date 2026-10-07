// Recharge card from the design: wallet icon on the left, red "Recharge Now" button on the right.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AppButton from '../../../components/common/AppButton';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderRadius: radius.md,
      backgroundColor: colors.secondaryLight,
      borderWidth: 1.5,
      borderBottomWidth: 4,
      borderColor: colors.secondaryBorder,
    },
    iconCircle: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      backgroundColor: colors.secondarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    text: { flex: 1 },
  });

export default function PayCard() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  // Recharge is per vehicle, so for now this opens the vehicle list. Point it at Payments when that screen exists.
  const openVehicles = () => navigation.navigate(routeNames.vehicles);

  return (
    <View style={styles.card}>
      <View style={styles.iconCircle}>
        <Icon source="wallet-outline" size={22} color={colors.secondary} />
      </View>
      <AppText variant="caption" color={colors.textSecondary} style={styles.text}>
        Keep your service active
      </AppText>
      <AppButton title="Recharge Now" variant="secondary" isCompact onPress={openVehicles} />
    </View>
  );
}
