// The warranty countdown of every device, for the Warranty page in Profile.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as warrantyApi from '../../api/warrantyApi';
import { parseWarranties } from '../../utils/warranty';
import { logout } from '../actions';

const STALE_AFTER_MS = 5 * 60 * 1000; // the countdown keeps going on the phone, so the list can be a few minutes old

const initialState = {
  items: [], // [{ deviceId, name, plateNumber, startDate, endDate, period, isExpired, secondsLeft }]
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  fetchedAt: null, // when the answer arrived (ms); the seconds left count from here
};

/** Load the list. Skipped when it is fresh unless `force`. @param {{ force?: boolean }} [options] */
export const fetchWarranties = createAsyncThunk(
  'warranty/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await warrantyApi.getAllWarranties();
      if (data && data.status === 0) {
        return rejectWithValue(data.message || 'Could not load the warranty list');
      }
      return parseWarranties(data);
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, fetchedAt } = getState().warranty;
      if (options.force) {
        return true;
      }
      if (status === 'loading') {
        return false;
      }
      return !(fetchedAt && Date.now() - fetchedAt < STALE_AFTER_MS);
    },
  },
);

const warrantySlice = createSlice({
  name: 'warranty',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchWarranties.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchWarranties.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.fetchedAt = Date.now();
      })
      .addCase(fetchWarranties.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the warranty list';
      })
      .addCase(logout, () => initialState);
  },
});

export default warrantySlice.reducer;

// Selectors
export const selectWarranty = (state) => state.warranty;
