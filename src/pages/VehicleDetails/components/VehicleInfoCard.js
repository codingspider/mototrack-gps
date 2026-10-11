// One card for the top of the details page: the vehicle summary and the Recharge now button.
// Service expiry and device warranty are under "More details". Compact, so it fits with the action row.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import Card from '../../../components/common/Card';
import { spacing, useThemedStyles } from '../../../theme';
import RechargeButton from './RechargeButton';
import VehicleSummary from './VehicleSummary';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: spacing.md },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  });

export default function VehicleInfoCard({ vehicleId }) {
  const styles = useThemedStyles(makeStyles);

  return (
    <Card style={styles.card}>
      <VehicleSummary vehicleId={vehicleId} />
      <View style={styles.divider} />
      <RechargeButton vehicleId={vehicleId} />
    </Card>
  );
}
