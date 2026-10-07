// Red "Pay now" call-to-action card from the design.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { colors, radius, spacing } from '../../../theme';

export default function PayCard() {
  const navigation = useNavigation();

  // Renewal is per vehicle, so for now this opens the vehicle list. Point it at Payments when that screen exists.
  const openVehicles = () => navigation.navigate(routeNames.vehicles);

  return (
    <TouchableRipple onPress={openVehicles} borderless style={styles.card}>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Icon source="wallet-outline" size={22} color={colors.secondary} />
        </View>
        <View style={styles.text}>
          <AppText variant="title">৳ Pay</AppText>
          <AppText variant="caption" color={colors.secondary} style={styles.cta}>
            PAY NOW
          </AppText>
        </View>
      </View>
    </TouchableRipple>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.md,
    backgroundColor: colors.secondaryLight,
    borderWidth: 1.5,
    borderBottomWidth: 4,
    borderColor: colors.secondaryBorder,
  },
  row: { flexDirection: 'row', alignItems: 'center', padding: spacing.md },
  iconCircle: {
    width: 44,
    height: 44,
    borderRadius: radius.round,
    backgroundColor: colors.secondarySoft,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: { flex: 1, alignItems: 'center', paddingRight: 44 },
  cta: { fontWeight: '700', letterSpacing: 1 },
});
