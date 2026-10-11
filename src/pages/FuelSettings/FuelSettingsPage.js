// Fuel settings of one vehicle: how its fuel is measured, the rate and the fuel price. The fuel report summary uses
// them to estimate fuel used and its cost. Opens with `{ id }` (the vehicle).
import React, { useEffect, useRef, useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, View } from 'react-native';
import { Chip } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppInput from '../../components/common/AppInput';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/skeleton/Skeleton';
import { fetchFuelSettings, saveFuelSettings, selectFuelSettings } from '../../store/slices/fuelSettingsSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { FUEL_MEASUREMENTS, getMeasurement, validateFuelForm } from '../../utils/fuelSettings';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.md, gap: spacing.md, paddingBottom: spacing.xxl },
    card: { gap: spacing.sm },
    chips: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  });

/** The number as text for an input: 0 shows empty so the customer just types. */
const toInputText = (value) => (value > 0 ? String(value) : '');

export default function FuelSettingsPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));
  const { settings, status, isSaving, error } = useSelector(selectFuelSettings(id));
  const hasFilledRef = useRef(false);

  const [measurementId, setMeasurementId] = useState(1);
  const [quantity, setQuantity] = useState('');
  const [price, setPrice] = useState('');

  useEffect(() => {
    dispatch(fetchFuelSettings({ deviceId: id }));
  }, [dispatch, id]);

  // Fill the form once with what the server has (not again, or typing would be overwritten)
  useEffect(() => {
    if (!settings || hasFilledRef.current) {
      return;
    }
    hasFilledRef.current = true;
    setMeasurementId(settings.measurementId || 1);
    setQuantity(toInputText(settings.quantity));
    setPrice(toInputText(settings.price));
  }, [settings]);

  const measurement = getMeasurement(measurementId);

  const save = async () => {
    const problem = validateFuelForm({ measurementId, quantity, price });
    if (problem) {
      dispatch(showToast({ type: 'warning', message: problem }));
      return;
    }
    const result = await dispatch(
      saveFuelSettings({
        deviceId: id,
        measurementId,
        quantity: Number(quantity === '' ? 0 : quantity),
        price: Number(price === '' ? 0 : price),
      }),
    );
    if (saveFuelSettings.rejected.match(result)) {
      dispatch(showToast({ type: 'error', message: result.payload ? result.payload.message : 'Could not save' }));
      return;
    }
    dispatch(showToast({ type: 'success', message: 'Fuel settings saved' }));
    navigation.goBack();
  };

  if (status === 'failed' && !settings) {
    return <ErrorState message={error} onRetry={() => dispatch(fetchFuelSettings({ deviceId: id, force: true }))} />;
  }
  if (!settings) {
    return (
      <View style={styles.content}>
        <Skeleton height={200} />
        <Skeleton height={56} />
      </View>
    );
  }

  return (
    <KeyboardAvoidingView style={styles.screen}>
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        {!!vehicle && <AppText variant="subtitle">{vehicle.device_name}</AppText>}
        <Card style={styles.card}>
          <AppText color={colors.textSecondary}>Fuel measurement</AppText>
          <View style={styles.chips}>
            {FUEL_MEASUREMENTS.map((item) => {
              const isSelected = item.id === measurementId;
              return (
                <Chip
                  key={item.id}
                  selected={isSelected}
                  showSelectedCheck={false}
                  onPress={() => setMeasurementId(item.id)}
                  style={{ backgroundColor: isSelected ? colors.primary : colors.background }}
                  textStyle={{ color: isSelected ? colors.textOnPrimary : colors.text }}
                >
                  {item.title}
                </Chip>
              );
            })}
          </View>
          <AppInput
            label={measurement.quantityLabel}
            value={quantity}
            onChangeText={setQuantity}
            keyboardType="decimal-pad"
            placeholder="0"
          />
          <AppInput
            label={`${measurement.priceLabel} (৳)`}
            value={price}
            onChangeText={setPrice}
            keyboardType="decimal-pad"
            placeholder="0.00"
          />
          <AppText variant="caption" color={colors.textSecondary}>
            The report summary estimates fuel used and its cost from this rate and the distance driven.
          </AppText>
        </Card>
        <AppButton title="Save" isLoading={isSaving} onPress={save} />
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
