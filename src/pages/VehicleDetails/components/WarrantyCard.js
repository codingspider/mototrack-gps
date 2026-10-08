// "Device warranty" card: valid until / expired on, from GET /warranty-check. Hidden until it is loaded.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { formatDateOnly } from '../../../utils/formatDate';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    iconCircle: {
      width: 36,
      height: 36,
      borderRadius: radius.round,
      backgroundColor: colors.primarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
  });

export default function WarrantyCard({ vehicleId }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const warranty = useSelector(selectVehicleById(vehicleId))?.warranty;
  if (!warranty) {
    return null;
  }
  const hasExpired = !!warranty.expired;
  const dateText = formatDateOnly(warranty.warranty_end);

  return (
    <View>
      <View style={styles.row}>
        <View style={styles.iconCircle}>
          <Icon source="shield-check-outline" size={20} color={hasExpired ? colors.secondary : colors.primary} />
        </View>
        <View>
          <AppText variant="body">Device warranty</AppText>
          <AppText variant="caption" color={hasExpired ? colors.secondary : colors.textSecondary}>
            {hasExpired ? `Expired on ${dateText}` : `Valid until ${dateText}`}
          </AppText>
        </View>
      </View>
    </View>
  );
}
