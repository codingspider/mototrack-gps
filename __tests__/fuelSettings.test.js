// A vehicle's fuel settings: reading the server's fields, validating the form, the estimate, and saving.
import { configureStore } from '@reduxjs/toolkit';
import * as fuelSettingsApi from '../src/api/fuelSettingsApi';
import fuelSettingsReducer, { fetchFuelSettings, saveFuelSettings } from '../src/store/slices/fuelSettingsSlice';
import { estimateFuel, getMeasurement, parseFuelSettings, validateFuelForm } from '../src/utils/fuelSettings';

jest.mock('../src/api/fuelSettingsApi');

describe('parseFuelSettings', () => {
  it('reads the three fields, numbers may be text', () => {
    expect(parseFuelSettings({ item: { fuel_measurement_id: '1', fuel_quantity: '40.00', fuel_price: '112.50' } })).toEqual({
      measurementId: 1,
      quantity: 40,
      price: 112.5,
    });
  });

  it('falls back when the vehicle has none set', () => {
    expect(parseFuelSettings({ item: { fuel_measurement_id: null, fuel_quantity: null, fuel_price: '0.00' } })).toEqual({
      measurementId: null,
      quantity: 0,
      price: 0,
    });
    expect(parseFuelSettings(undefined).measurementId).toBeNull();
  });
});

describe('measurements', () => {
  it('knows the five server ids', () => {
    expect([1, 2, 3, 4, 5].map((id) => getMeasurement(id).title)).toEqual(['l/100km', 'MPG', 'kWh/km', 'l/h', 'km/l']);
    expect(getMeasurement(9)).toBeNull();
  });
});

describe('estimateFuel', () => {
  it('l/100km: 40 l per 100 km over 17.3 km', () => {
    expect(estimateFuel({ measurementId: 1, quantity: 40, price: 100 }, 17.3, null)).toEqual({ amount: 6.9, unit: 'L', cost: 692 });
  });

  it('km/l: 10 km per liter', () => {
    expect(estimateFuel({ measurementId: 5, quantity: 10, price: 0 }, 55, null)).toEqual({ amount: 5.5, unit: 'L', cost: null });
  });

  it('MPG: the price is per gallon', () => {
    const result = estimateFuel({ measurementId: 2, quantity: 25, price: 378.541 }, 100, null);
    expect(result.unit).toBe('L');
    expect(result.amount).toBeCloseTo(9.4, 1); // 100 km at 25 mpg
    expect(result.cost).toBe(941); // 9.4087 L at 378.541 per gallon (= 100 per liter), from the unrounded amount
  });

  it('l/h needs the engine time', () => {
    expect(estimateFuel({ measurementId: 4, quantity: 3, price: 0 }, 10, 7200)).toEqual({ amount: 6, unit: 'L', cost: null });
    expect(estimateFuel({ measurementId: 4, quantity: 3, price: 0 }, 10, null)).toBeNull();
  });

  it('is null without a rate or settings', () => {
    expect(estimateFuel({ measurementId: 1, quantity: 0, price: 5 }, 10, null)).toBeNull();
    expect(estimateFuel(null, 10, null)).toBeNull();
    expect(estimateFuel({ measurementId: 1, quantity: 40, price: 0 }, null, null)).toBeNull();
  });
});

describe('validateFuelForm', () => {
  it('needs a measurement and valid numbers; empty counts as 0', () => {
    expect(validateFuelForm({ measurementId: null, quantity: '', price: '' })).toBe('Choose how fuel is measured');
    expect(validateFuelForm({ measurementId: 1, quantity: 'abc', price: '' })).toBe('Enter a valid fuel rate');
    expect(validateFuelForm({ measurementId: 1, quantity: '40', price: '-2' })).toBe('Enter a valid fuel price');
    expect(validateFuelForm({ measurementId: 1, quantity: '', price: '' })).toBeNull();
  });
});

describe('fuelSettingsSlice', () => {
  const makeStore = () => configureStore({ reducer: { fuelSettings: fuelSettingsReducer } });
  const serverItem = { item: { fuel_measurement_id: 5, fuel_quantity: '9.50', fuel_price: '110' } };

  beforeEach(() => {
    fuelSettingsApi.getEditData.mockReset();
    fuelSettingsApi.saveFuelSettings.mockReset();
  });

  it('loads the settings and does not ask again while fresh', async () => {
    fuelSettingsApi.getEditData.mockResolvedValue(serverItem);
    const store = makeStore();
    await store.dispatch(fetchFuelSettings({ deviceId: 6 }));
    await store.dispatch(fetchFuelSettings({ deviceId: 6 }));
    expect(fuelSettingsApi.getEditData).toHaveBeenCalledTimes(1);
    expect(store.getState().fuelSettings.byDevice[6].settings).toEqual({ measurementId: 5, quantity: 9.5, price: 110 });
  });

  it('saves, then reads the vehicle back', async () => {
    fuelSettingsApi.saveFuelSettings.mockResolvedValue({ status: 1, id: 6 });
    fuelSettingsApi.getEditData.mockResolvedValue(serverItem);
    const store = makeStore();
    const result = await store.dispatch(saveFuelSettings({ deviceId: 6, measurementId: 5, quantity: 9.5, price: 110 }));
    expect(saveFuelSettings.fulfilled.match(result)).toBe(true);
    expect(fuelSettingsApi.saveFuelSettings).toHaveBeenCalledWith({ deviceId: 6, measurementId: 5, quantity: 9.5, price: 110 });
    expect(fuelSettingsApi.getEditData).toHaveBeenCalledTimes(1);
    expect(store.getState().fuelSettings.byDevice[6].isSaving).toBe(false);
  });

  it('keeps the server message when saving fails', async () => {
    fuelSettingsApi.saveFuelSettings.mockRejectedValue(new Error('The fuel quantity must be a number.'));
    const store = makeStore();
    const result = await store.dispatch(saveFuelSettings({ deviceId: 6, measurementId: 1, quantity: 1, price: 1 }));
    expect(result.payload.message).toBe('The fuel quantity must be a number.');
    expect(store.getState().fuelSettings.byDevice[6].isSaving).toBe(false);
  });
});
