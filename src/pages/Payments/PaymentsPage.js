// Renew page: pick vehicles, pick a plan and quantity, then pay with DGePay (same steps as the web "Pay for Devices").
// Vehicles, plans and expiry dates come from Redux; only the cart (what is ticked) lives in this screen.
import React, { useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import ErrorState from '../../components/common/ErrorState';
import routeNames from '../../routes/routeNames';
import { fetchExpiry, fetchPlans, selectCheckout, selectExpiry, selectPlans, startCheckout } from '../../store/slices/paymentsSlice';
import { showToast } from '../../store/slices/toastSlice';
import { fetchVehicles, selectAllVehicles, selectVehiclesError, selectVehiclesStatus } from '../../store/slices/vehiclesSlice';
import { getCartTotal } from '../../utils/payments';
import { spacing, useAppTheme } from '../../theme';
import CartSummary from './components/CartSummary';
import PaymentsSkeleton from './PaymentsSkeleton';
import PlanPicker from './components/PlanPicker';
import VehiclePicker from './components/VehiclePicker';

/** @param {{ route: { params?: { vehicleId?: number } } }} props vehicleId = tick this vehicle first */
export default function PaymentsPage({ route, navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const vehicles = useSelector(selectAllVehicles);
  const vehiclesStatus = useSelector(selectVehiclesStatus);
  const vehiclesError = useSelector(selectVehiclesError);
  const plans = useSelector(selectPlans);
  const expiry = useSelector(selectExpiry);
  const checkout = useSelector(selectCheckout);
  const preselectedId = route.params?.vehicleId;

  const [selectedIds, setSelectedIds] = useState(preselectedId ? [preselectedId] : []);
  const [selectedPlanId, setSelectedPlanId] = useState(null);
  const [quantity, setQuantity] = useState(1);

  // Each of these loads only when missing or stale (see the thunk conditions)
  useEffect(() => {
    dispatch(fetchVehicles());
    dispatch(fetchPlans());
    dispatch(fetchExpiry());
  }, [dispatch]);

  // With one plan only there is nothing to choose: tick it for the customer
  useEffect(() => {
    if (!selectedPlanId && plans.items.length === 1) {
      setSelectedPlanId(plans.items[0].id);
    }
  }, [plans.items, selectedPlanId]);

  const refresh = () => {
    dispatch(fetchVehicles({ force: true }));
    dispatch(fetchPlans({ force: true }));
    dispatch(fetchExpiry({ force: true }));
  };

  const plan = useMemo(() => plans.items.find((item) => item.id === selectedPlanId) || null, [plans.items, selectedPlanId]);
  const cart = {
    vehicleCount: selectedIds.length,
    plan,
    quantity,
    total: plan ? getCartTotal(plan.price, quantity, selectedIds.length) : 0,
  };

  const handlePay = async () => {
    const result = await dispatch(startCheckout({ deviceIds: selectedIds, plan, quantity }));
    if (startCheckout.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload || 'The payment could not be started' }));
      return;
    }
    navigation.navigate(routeNames.paymentCheckout);
  };

  const isFirstLoad =
    (vehicles.length === 0 && vehiclesStatus === 'loading') || (plans.items.length === 0 && plans.status === 'loading');
  if (isFirstLoad) {
    return <PaymentsSkeleton />;
  }
  if (vehicles.length === 0 && vehiclesError) {
    return <ErrorState message={vehiclesError} onRetry={refresh} />;
  }
  if (plans.items.length === 0 && plans.error) {
    return <ErrorState message={plans.error} onRetry={refresh} />;
  }

  return (
    <ScrollView
      style={[styles.screen, { backgroundColor: colors.background }]}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
      refreshControl={<RefreshControl refreshing={false} onRefresh={refresh} />}
    >
      <VehiclePicker vehicles={vehicles} expiryById={expiry.byId} selectedIds={selectedIds} onChange={setSelectedIds} />
      <PlanPicker
        plans={plans.items}
        selectedPlanId={selectedPlanId}
        onSelectPlan={(id) => {
          setSelectedPlanId(id);
          setQuantity(1);
        }}
        quantity={quantity}
        onChangeQuantity={setQuantity}
      />
      <CartSummary cart={cart} isStarting={checkout.status === 'starting'} onPay={handlePay} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
});
