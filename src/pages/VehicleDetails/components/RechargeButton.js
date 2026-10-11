// The red "Recharge now" button on the info card. Opens the Recharge page with this vehicle ticked;
// the server decides the price and the new expiry date. (The expiry date itself is under "More details".)
import React from 'react';
import { useNavigation } from '@react-navigation/native';
import AppButton from '../../../components/common/AppButton';
import routeNames from '../../../routes/routeNames';

export default function RechargeButton({ vehicleId }) {
  const navigation = useNavigation();

  return (
    <AppButton
      title="Recharge now"
      variant="secondary"
      isCompact
      onPress={() => navigation.navigate(routeNames.payments, { vehicleId })}
    />
  );
}
