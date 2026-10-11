// The fuel measurement of each vehicle the customer opened (rate and price). The server decides: after Save the app
// reads the values back, so the screen always shows what the server really has.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as fuelSettingsApi from '../../api/fuelSettingsApi';
import { parseFuelSettings } from '../../utils/fuelSettings';
import { logout } from '../actions';

const STALE_AFTER_MS = 10 * 60 * 1000; // a fuel rate hardly ever changes

const emptyEntry = { settings: null, status: 'idle', isSaving: false, error: null, lastFetchedAt: null };

/** @param {{ deviceId: number, force?: boolean }} request */
export const fetchFuelSettings = createAsyncThunk(
  'fuelSettings/fetch',
  async ({ deviceId }, { rejectWithValue }) => {
    try {
      const data = await fuelSettingsApi.getEditData(deviceId);
      return { deviceId, settings: parseFuelSettings(data) };
    } catch (error) {
      return rejectWithValue({ deviceId, message: error.message });
    }
  },
  {
    condition: ({ deviceId, force }, { getState }) => {
      const entry = getState().fuelSettings.byDevice[deviceId] || emptyEntry;
      if (entry.status === 'loading') {
        return false;
      }
      const isFresh = entry.lastFetchedAt && Date.now() - entry.lastFetchedAt < STALE_AFTER_MS;
      return !!force || !isFresh;
    },
  },
);

/** @param {{ deviceId: number, measurementId: number, quantity: number, price: number }} request */
export const saveFuelSettings = createAsyncThunk(
  'fuelSettings/save',
  async ({ deviceId, measurementId, quantity, price }, { dispatch, rejectWithValue }) => {
    try {
      const data = await fuelSettingsApi.saveFuelSettings({ deviceId, measurementId, quantity, price });
      if (data && data.status === 0) {
        return rejectWithValue({ deviceId, message: data.message || 'Could not save the fuel settings' });
      }
      // Read it back: never trust the answer of the change itself
      await dispatch(fetchFuelSettings({ deviceId, force: true })).unwrap();
      return { deviceId };
    } catch (error) {
      // Either an Error from the request, or the { message } the read-back rejected with
      return rejectWithValue({ deviceId, message: (error && error.message) || 'Could not save the fuel settings' });
    }
  },
);

const fuelSettingsSlice = createSlice({
  name: 'fuelSettings',
  initialState: { byDevice: {} },
  reducers: {},
  extraReducers: (builder) => {
    const current = (state, deviceId) => state.byDevice[deviceId] || emptyEntry;
    builder
      .addCase(fetchFuelSettings.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'loading', error: null };
      })
      .addCase(fetchFuelSettings.fulfilled, (state, action) => {
        const { deviceId, settings } = action.payload;
        state.byDevice[deviceId] = { ...current(state, deviceId), settings, status: 'succeeded', lastFetchedAt: Date.now() };
      })
      .addCase(fetchFuelSettings.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        const message = (action.payload && action.payload.message) || 'Could not load the fuel settings';
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'failed', error: message };
      })
      .addCase(saveFuelSettings.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: true };
      })
      .addCase(saveFuelSettings.fulfilled, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: false };
      })
      .addCase(saveFuelSettings.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: false };
      })
      .addCase(logout, () => ({ byDevice: {} }));
  },
});

export default fuelSettingsSlice.reducer;

// Selectors
export const selectFuelSettings = (deviceId) => (state) => state.fuelSettings.byDevice[deviceId] || emptyEntry;
