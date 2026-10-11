// The overspeed limit of each vehicle the customer opened. The server decides: after Save or Remove the app
// reads the limit back, so the screen always shows what the server really has.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as overspeedApi from '../../api/overspeedApi';
import { logout } from '../actions';

const emptyLimit = { limit: null, status: 'idle', isSaving: false, error: null };

/** The vehicle's own limit as a number, or null when it has none. */
export function limitFromResponse(data) {
  const value = data && data.overspeed ? Number(data.overspeed.limit) : NaN;
  return Number.isFinite(value) && value > 0 ? value : null;
}

/** @param {{ deviceId: number }} request */
export const fetchOverspeedLimit = createAsyncThunk('overspeed/fetch', async ({ deviceId }, { rejectWithValue }) => {
  try {
    const data = await overspeedApi.getOverspeedLimit(deviceId);
    return { deviceId, limit: limitFromResponse(data) };
  } catch (error) {
    return rejectWithValue({ deviceId, message: error.message });
  }
});

// Speed limits the stepper allows
export const MIN_LIMIT_KMH = 20;
export const MAX_LIMIT_KMH = 200;

/** @param {{ deviceId: number, limit: number|null }} request limit null = remove */
export const saveOverspeedLimit = createAsyncThunk('overspeed/save', async ({ deviceId, limit }, { dispatch, rejectWithValue }) => {
  try {
    if (limit === null) {
      await overspeedApi.removeOverspeedLimit(deviceId);
    } else {
      await overspeedApi.setOverspeedLimit(deviceId, limit);
    }
    // Read it back: never trust the answer of the change itself
    const result = await dispatch(fetchOverspeedLimit({ deviceId })).unwrap();
    return result;
  } catch (error) {
    return rejectWithValue({ deviceId, message: error.message });
  }
});

const overspeedSlice = createSlice({
  name: 'overspeed',
  initialState: { byDevice: {} },
  reducers: {},
  extraReducers: (builder) => {
    const current = (state, deviceId) => state.byDevice[deviceId] || emptyLimit;
    builder
      .addCase(fetchOverspeedLimit.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'loading', error: null };
      })
      .addCase(fetchOverspeedLimit.fulfilled, (state, action) => {
        const { deviceId, limit } = action.payload;
        state.byDevice[deviceId] = { ...current(state, deviceId), limit, status: 'succeeded' };
      })
      .addCase(fetchOverspeedLimit.rejected, (state, action) => {
        const { deviceId, message } = action.payload || { deviceId: action.meta.arg.deviceId, message: 'Could not load the limit' };
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'failed', error: message };
      })
      .addCase(saveOverspeedLimit.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: true };
      })
      .addCase(saveOverspeedLimit.fulfilled, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: false };
      })
      .addCase(saveOverspeedLimit.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: false };
      })
      .addCase(logout, () => ({ byDevice: {} }));
  },
});

export default overspeedSlice.reducer;

// Selectors
export const selectOverspeed = (deviceId) => (state) => state.overspeed.byDevice[deviceId] || emptyLimit;
