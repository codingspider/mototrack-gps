// The alert rules of each vehicle the customer opened, loaded one page at a time.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as deviceAlertsApi from '../../api/deviceAlertsApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;
const emptyEntry = {
  items: [],
  page: 0,
  lastPage: 1,
  total: 0,
  status: 'idle',
  isLoadingMore: false,
  savingAlertId: null, // the alert being switched right now
  error: null,
  lastFetchedAt: null,
};

const pageInfo = (data) => {
  const pagination = (data && data.meta && data.meta.pagination) || {};
  return { page: pagination.current_page || 1, lastPage: pagination.last_page || 1, total: pagination.total ?? 0 };
};

/** First page (replaces the list). Skipped when fresh unless `force`. @param {{ deviceId: number, force?: boolean }} request */
export const fetchDeviceAlerts = createAsyncThunk(
  'deviceAlerts/fetch',
  async ({ deviceId }, { rejectWithValue }) => {
    try {
      const data = await deviceAlertsApi.getDeviceAlerts(deviceId, 1);
      return { deviceId, items: data.data || [], ...pageInfo(data) };
    } catch (error) {
      return rejectWithValue({ deviceId, message: error.message });
    }
  },
  {
    condition: ({ deviceId, force }, { getState }) => {
      const entry = getState().deviceAlerts.byDevice[deviceId] || emptyEntry;
      if (entry.status === 'loading') {
        return false;
      }
      return !!force || !(entry.lastFetchedAt && Date.now() - entry.lastFetchedAt < STALE_AFTER_MS);
    },
  },
);

/**
 * Switch one alert on or off, then read the list back (the server is the one that decides).
 * @param {{ deviceId: number, alertId: number, isActive: boolean }} request
 */
export const toggleDeviceAlert = createAsyncThunk(
  'deviceAlerts/toggle',
  async ({ deviceId, alertId, isActive }, { dispatch, rejectWithValue }) => {
    try {
      await deviceAlertsApi.setAlertActive(alertId, isActive);
      await dispatch(fetchDeviceAlerts({ deviceId, force: true })).unwrap();
      return { deviceId, alertId, isActive };
    } catch (error) {
      return rejectWithValue({ deviceId, alertId, message: (error && error.message) || 'Could not change the alert' });
    }
  },
);

/** The next page, added below. @param {{ deviceId: number }} request */
export const fetchMoreDeviceAlerts = createAsyncThunk(
  'deviceAlerts/fetchMore',
  async ({ deviceId }, { getState, rejectWithValue }) => {
    try {
      const { page } = getState().deviceAlerts.byDevice[deviceId];
      const data = await deviceAlertsApi.getDeviceAlerts(deviceId, page + 1);
      return { deviceId, items: data.data || [], ...pageInfo(data) };
    } catch (error) {
      return rejectWithValue({ deviceId, message: error.message });
    }
  },
  {
    condition: ({ deviceId }, { getState }) => {
      const entry = getState().deviceAlerts.byDevice[deviceId];
      return !!entry && entry.status === 'succeeded' && !entry.isLoadingMore && entry.page < entry.lastPage;
    },
  },
);

const deviceAlertsSlice = createSlice({
  name: 'deviceAlerts',
  initialState: { byDevice: {} },
  reducers: {},
  extraReducers: (builder) => {
    const current = (state, deviceId) => state.byDevice[deviceId] || emptyEntry;
    builder
      .addCase(fetchDeviceAlerts.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'loading', error: null };
      })
      .addCase(fetchDeviceAlerts.fulfilled, (state, action) => {
        const { deviceId, items, page, lastPage, total } = action.payload;
        state.byDevice[deviceId] = {
          ...emptyEntry,
          items,
          page,
          lastPage,
          total,
          status: 'succeeded',
          lastFetchedAt: Date.now(),
        };
      })
      .addCase(fetchDeviceAlerts.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        const message = (action.payload && action.payload.message) || 'Could not load the alerts';
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'failed', error: message };
      })
      .addCase(toggleDeviceAlert.pending, (state, action) => {
        const { deviceId, alertId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), savingAlertId: alertId };
      })
      .addCase(toggleDeviceAlert.fulfilled, (state, action) => {
        const entry = state.byDevice[action.meta.arg.deviceId];
        if (entry) {
          entry.savingAlertId = null;
        }
      })
      .addCase(toggleDeviceAlert.rejected, (state, action) => {
        const entry = state.byDevice[action.meta.arg.deviceId];
        if (entry) {
          entry.savingAlertId = null;
        }
      })
      .addCase(fetchMoreDeviceAlerts.pending, (state, action) => {
        state.byDevice[action.meta.arg.deviceId].isLoadingMore = true;
      })
      .addCase(fetchMoreDeviceAlerts.fulfilled, (state, action) => {
        const { deviceId, items, page, lastPage, total } = action.payload;
        const entry = state.byDevice[deviceId];
        const known = new Set(entry.items.map((item) => item.id));
        entry.items.push(...items.filter((item) => !known.has(item.id)));
        Object.assign(entry, { page, lastPage, total, isLoadingMore: false });
      })
      .addCase(fetchMoreDeviceAlerts.rejected, (state, action) => {
        state.byDevice[action.meta.arg.deviceId].isLoadingMore = false;
      })
      .addCase(logout, () => ({ byDevice: {} }));
  },
});

export default deviceAlertsSlice.reducer;

// Selectors
export const selectDeviceAlerts = (deviceId) => (state) => state.deviceAlerts.byDevice[deviceId] || emptyEntry;
