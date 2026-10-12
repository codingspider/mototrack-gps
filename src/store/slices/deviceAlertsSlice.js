// The alerts (events) of each vehicle the customer opened, newest first, one page at a time.
// Same data as the Alerts tab, filtered by vehicle (GET /notifications?device_id=).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as notificationsApi from '../../api/notificationsApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 15 * 1000; // alerts are time-sensitive: reload when older than 15 seconds
const PAGE_SIZE = 20;
const emptyEntry = {
  items: [],
  currentPage: 0,
  lastPage: 1,
  total: 0,
  status: 'idle', // the first page
  isLoadingMore: false,
  error: null,
  lastFetchedAt: null,
};

/** First page (replaces the list). Skipped when fresh unless `force`. @param {{ deviceId: number, force?: boolean }} request */
export const fetchDeviceAlerts = createAsyncThunk(
  'deviceAlerts/fetch',
  async ({ deviceId }, { rejectWithValue }) => {
    try {
      const data = await notificationsApi.getNotifications({ page: 1, perPage: PAGE_SIZE, deviceId });
      return { deviceId, data };
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

/** The next page, added below. @param {{ deviceId: number }} request */
export const fetchMoreDeviceAlerts = createAsyncThunk(
  'deviceAlerts/fetchMore',
  async ({ deviceId }, { getState, rejectWithValue }) => {
    try {
      const { currentPage } = getState().deviceAlerts.byDevice[deviceId];
      const data = await notificationsApi.getNotifications({ page: currentPage + 1, perPage: PAGE_SIZE, deviceId });
      return { deviceId, data };
    } catch (error) {
      return rejectWithValue({ deviceId, message: error.message });
    }
  },
  {
    condition: ({ deviceId }, { getState }) => {
      const entry = getState().deviceAlerts.byDevice[deviceId];
      return !!entry && entry.status === 'succeeded' && !entry.isLoadingMore && entry.currentPage < entry.lastPage;
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
        const { deviceId, data } = action.payload;
        const items = data.items || [];
        const pagination = data.pagination;
        state.byDevice[deviceId] = {
          ...emptyEntry,
          items,
          currentPage: pagination ? pagination.current_page : 1,
          lastPage: pagination ? pagination.last_page : 1,
          total: pagination ? pagination.total : items.length,
          status: 'succeeded',
          lastFetchedAt: Date.now(),
        };
      })
      .addCase(fetchDeviceAlerts.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        const message = (action.payload && action.payload.message) || 'Could not load the alerts';
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'failed', error: message };
      })
      .addCase(fetchMoreDeviceAlerts.pending, (state, action) => {
        state.byDevice[action.meta.arg.deviceId].isLoadingMore = true;
      })
      .addCase(fetchMoreDeviceAlerts.fulfilled, (state, action) => {
        const { deviceId, data } = action.payload;
        const entry = state.byDevice[deviceId];
        // New alerts may have arrived since page 1: never show the same alert twice
        const knownIds = new Set(entry.items.map((item) => item.id));
        entry.items.push(...(data.items || []).filter((item) => !knownIds.has(item.id)));
        entry.currentPage = data.pagination ? data.pagination.current_page : entry.currentPage + 1;
        entry.lastPage = data.pagination ? data.pagination.last_page : entry.lastPage;
        entry.isLoadingMore = false;
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
