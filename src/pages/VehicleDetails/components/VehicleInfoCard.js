// One card for the top of the details page: vehicle summary, service expiry and device warranty,
// separated by thin lines. Compact, so it fits in the bottom half of the screen with the action grid.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import Card from '../../../components/common/Card';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { spacing, useThemedStyles } from '../../../theme';
import ServiceExpiryCard from './ServiceExpiryCard';
import VehicleSummary from './VehicleSummary';
import WarrantyCard from './WarrantyCard';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { padding: spacing.md },
    divider: { height: StyleSheet.hairlineWidth, backgroundColor: colors.border, marginVertical: spacing.sm },
  });

export default function VehicleInfoCard({ vehicleId }) {
  const styles = useThemedStyles(makeStyles);
  const hasWarranty = !!useSelector(selectVehicleById(vehicleId))?.warranty;

  return (
    <Card style={styles.card}>
      <VehicleSummary vehicleId={vehicleId} />
      <View style={styles.divider} />
      <ServiceExpiryCard vehicleId={vehicleId} />
      {hasWarranty && <View style={styles.divider} />}
      <WarrantyCard vehicleId={vehicleId} />
    </Card>
  );
}
