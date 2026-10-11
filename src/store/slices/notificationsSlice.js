// The customer's alerts, newest first, loaded one page at a time (pull to refresh, scroll to load more).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as notificationsApi from '../../api/notificationsApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;
const PAGE_SIZE = 20;

const initialState = {
  items: [],
  currentPage: 0,
  lastPage: 1,
  total: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
  lastFetchedAt: null,
};

/** Load the first page (replaces the list). Skipped when the list is fresh, unless `force`. */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsApi.getNotifications({ page: 1, perPage: PAGE_SIZE });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().notifications;
      if (status === 'loading') {
        return false;
      }
      if (options.force) {
        return true;
      }
      return !(lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS);
    },
  },
);

/** Load the next page and add it below the list. */
export const fetchMoreNotifications = createAsyncThunk(
  'notifications/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { currentPage } = getState().notifications;
      return await notificationsApi.getNotifications({ page: currentPage + 1, perPage: PAGE_SIZE });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { status, isLoadingMore, currentPage, lastPage } = getState().notifications;
      return status === 'succeeded' && !isLoadingMore && currentPage < lastPage;
    },
  },
);

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchNotifications.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchNotifications.fulfilled, (state, action) => {
        const { items, pagination } = action.payload;
        state.items = items || [];
        state.currentPage = pagination ? pagination.current_page : 1;
        state.lastPage = pagination ? pagination.last_page : 1;
        state.total = pagination ? pagination.total : state.items.length;
        state.status = 'succeeded';
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchNotifications.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the alerts';
      })
      .addCase(fetchMoreNotifications.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreNotifications.fulfilled, (state, action) => {
        const { items, pagination } = action.payload;
        // New alerts may have arrived since page 1, shifting rows: never show the same alert twice
        const knownIds = new Set(state.items.map((item) => item.id));
        state.items.push(...(items || []).filter((item) => !knownIds.has(item.id)));
        state.currentPage = pagination ? pagination.current_page : state.currentPage + 1;
        state.lastPage = pagination ? pagination.last_page : state.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreNotifications.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default notificationsSlice.reducer;

// Selectors
export const selectNotifications = (state) => state.notifications;
