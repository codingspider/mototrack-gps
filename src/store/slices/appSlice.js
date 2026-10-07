// App-wide things: socket connection status and the home sliders.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as settingsApi from '../../api/settingsApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 10 * 60 * 1000;

const initialState = {
  socketStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected'
  sliders: {
    items: [],
    status: 'idle',
    error: null,
    lastFetchedAt: null,
  },
};

export const fetchSliders = createAsyncThunk(
  'app/fetchSliders',
  async (_, { rejectWithValue }) => {
    try {
      const data = await settingsApi.getSliders();
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().app.sliders;
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

const appSlice = createSlice({
  name: 'app',
  initialState,
  reducers: {
    setSocketStatus(state, action) {
      state.socketStatus = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchSliders.pending, (state) => {
        state.sliders.status = 'loading';
        state.sliders.error = null;
      })
      .addCase(fetchSliders.fulfilled, (state, action) => {
        state.sliders.status = 'succeeded';
        state.sliders.items = action.payload;
        state.sliders.lastFetchedAt = Date.now();
      })
      .addCase(fetchSliders.rejected, (state, action) => {
        state.sliders.status = 'failed';
        state.sliders.error = action.payload || 'Could not load sliders';
      })
      .addCase(logout, () => initialState);
  },
});

export const { setSocketStatus } = appSlice.actions;
export default appSlice.reducer;

// Selectors
export const selectSocketStatus = (state) => state.app.socketStatus;
export const selectSliders = (state) => state.app.sliders.items;