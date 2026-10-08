// App-wide things: socket connection status, the home sliders and the app settings (name + logos).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { Image } from 'react-native';
import * as settingsApi from '../../api/settingsApi';
import { loadCachedAppSettings, saveAppSettings } from '../../utils/settingsCache';
import { logout } from '../actions';

const STALE_AFTER_MS = 10 * 60 * 1000;
const SETTINGS_STALE_AFTER_MS = 60 * 60 * 1000; // the logo rarely changes

const initialState = {
  socketStatus: 'disconnected', // 'connected' | 'connecting' | 'disconnected'
  sliders: {
    items: [],
    status: 'idle',
    error: null,
    lastFetchedAt: null,
  },
  settings: {
    item: null, // { app_name, logo, logo_login, favicon }
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

/** App start: read the settings saved last time, so the logo shows instantly (before the network answers). */
export const loadCachedSettings = createAsyncThunk('app/loadCachedSettings', async () => {
  return await loadCachedAppSettings();
});

/** Get the app name and logos from the server, save them for next time and warm the picture cache. */
export const fetchAppSettings = createAsyncThunk(
  'app/fetchAppSettings',
  async (_, { rejectWithValue }) => {
    try {
      const data = await settingsApi.getAppSettings();
      const settings = data.item;
      if (settings) {
        saveAppSettings(settings);
        // Download the logo now, so it is ready in the picture cache when a screen draws it
        [settings.logo, settings.logo_login].filter(Boolean).forEach((url) => Image.prefetch(url));
      }
      return settings;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().app.settings;
      if (status === 'loading') {
        return false;
      }
      if (options.force) {
        return true;
      }
      const isFresh = lastFetchedAt && Date.now() - lastFetchedAt < SETTINGS_STALE_AFTER_MS;
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
      .addCase(loadCachedSettings.fulfilled, (state, action) => {
        // Never replace fresher settings that already arrived from the server
        if (action.payload && !state.settings.item) {
          state.settings.item = action.payload;
        }
      })
      .addCase(fetchAppSettings.pending, (state) => {
        state.settings.status = 'loading';
        state.settings.error = null;
      })
      .addCase(fetchAppSettings.fulfilled, (state, action) => {
        state.settings.status = 'succeeded';
        state.settings.lastFetchedAt = Date.now();
        if (action.payload) {
          state.settings.item = action.payload;
        }
      })
      .addCase(fetchAppSettings.rejected, (state, action) => {
        state.settings.status = 'failed';
        state.settings.error = action.payload || 'Could not load app settings';
      })
      // Logging out resets everything except the app settings: the Login screen needs the logo right away
      .addCase(logout, (state) => ({ ...initialState, settings: state.settings }));
  },
});

export const { setSocketStatus } = appSlice.actions;
export default appSlice.reducer;

// Selectors
export const selectSocketStatus = (state) => state.app.socketStatus;
export const selectSliders = (state) => state.app.sliders.items;
export const selectAppSettings = (state) => state.app.settings.item;
export const selectAppSettingsStatus = (state) => state.app.settings.status;
