// The customer's own profile (name, phone, photo).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as profileApi from '../../api/profileApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 10 * 60 * 1000; // profile rarely changes

const initialState = {
  item: null, // { first_name, last_name, phone_number, photo_url, ... }
  status: 'idle',
  error: null,
  lastFetchedAt: null,
};

export const fetchProfile = createAsyncThunk(
  'profile/fetchProfile',
  async (_, { rejectWithValue }) => {
    try {
      const data = await profileApi.getProfile();
      return data.item;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().profile;
      if (status === 'loading') {
        return false;
      }
      if (options.force) {
        return true;
      }
      const isFresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS;
      return !isFresh;
    },
  },
);

const profileSlice = createSlice({
  name: 'profile',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProfile.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchProfile.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.item = action.payload;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchProfile.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load profile';
      })
      .addCase(logout, () => initialState);
  },
});

export default profileSlice.reducer;

// Selectors
export const selectProfile = (state) => state.profile.item;