// Street addresses looked up from coordinates, kept by location so the same place is asked only once.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as addressApi from '../../api/addressApi';
import { logout } from '../actions';

const initialState = {
  byKey: {}, // { '24.8465,89.3730': { text: 'address', status: 'loading' | 'succeeded' | 'failed' } }
};

/** Same key for nearby points (4 decimals is about 11 m), so one lookup serves many alerts. */
export function addressKey(latitude, longitude) {
  return `${Number(latitude).toFixed(4)},${Number(longitude).toFixed(4)}`;
}

/** Pull the address text out of the server answer (plain string, or wrapped in data / address / items). */
export function parseAddress(data) {
  if (!data) {
    return '';
  }
  const text = typeof data === 'string' ? data : data.data ?? data.address ?? data.items;
  if (typeof text !== 'string') {
    return '';
  }
  // The server answers "-" when it has nothing for the place: treat it as no address
  const trimmed = text.trim();
  return trimmed === '-' ? '' : trimmed;
}

/** Look up one place. Skipped when it is already known or being asked. @param {{ latitude: number, longitude: number }} point */
export const fetchAddress = createAsyncThunk(
  'address/fetch',
  async ({ latitude, longitude }, { rejectWithValue }) => {
    try {
      return parseAddress(await addressApi.getGeoAddress(latitude, longitude));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: ({ latitude, longitude }, { getState }) => {
      const entry = getState().address.byKey[addressKey(latitude, longitude)];
      // A failed or empty lookup may be asked again (the next tap on a pin); a known or running one is not
      return !entry || entry.status === 'failed' || (entry.status === 'succeeded' && !entry.text);
    },
  },
);

const addressSlice = createSlice({
  name: 'address',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAddress.pending, (state, action) => {
        const { latitude, longitude } = action.meta.arg;
        state.byKey[addressKey(latitude, longitude)] = { text: '', status: 'loading' };
      })
      .addCase(fetchAddress.fulfilled, (state, action) => {
        const { latitude, longitude } = action.meta.arg;
        state.byKey[addressKey(latitude, longitude)] = { text: action.payload, status: 'succeeded' };
      })
      .addCase(fetchAddress.rejected, (state, action) => {
        const { latitude, longitude } = action.meta.arg;
        state.byKey[addressKey(latitude, longitude)] = { text: '', status: 'failed' };
      })
      .addCase(logout, () => initialState);
  },
});

export default addressSlice.reducer;

// Selectors
export const selectAddressText = (latitude, longitude) => (state) => {
  const entry = state.address.byKey[addressKey(latitude, longitude)];
  return entry ? entry.text : '';
};

/** 'loading' | 'succeeded' | 'failed' | '' (never asked). An answer without text counts as failed. */
export const selectAddressStatus = (latitude, longitude) => (state) => {
  const entry = state.address.byKey[addressKey(latitude, longitude)];
  if (!entry) {
    return '';
  }
  return entry.status === 'succeeded' && !entry.text ? 'failed' : entry.status;
};
