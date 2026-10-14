// The customer's alerts. The list shows TODAY's alerts, newest first, loaded one page at a time. Older alerts are
// loaded on request ("Show older alerts") and then also page by page while scrolling. It also keeps the count of
// alerts the customer has not seen yet, for the badge on the Alerts tab.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as notificationsApi from '../../api/notificationsApi';
import { addSecondToText, bdNowText, bdTodayStartText, laterText } from '../../utils/notifications';
import { readAlertsSeenAt, saveAlertsSeenAt } from '../../utils/alertsSeenStorage';
import { logout } from '../actions';

const STALE_AFTER_MS = 15 * 1000; // alerts are time-sensitive: reload when older than 15 seconds
const PAGE_SIZE = 20;

const initialState = {
  // today's alerts
  items: [],
  currentPage: 0,
  lastPage: 1,
  total: 0, // how many alerts today (from the server)
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
  lastFetchedAt: null,
  // older alerts, only after the customer asked for them
  isShowingOlder: false,
  olderItems: [],
  olderPage: 0,
  olderLastPage: 1,
  olderStatus: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  // the badge on the Alerts tab
  seenAtText: null, // Bangladesh time of the newest alert the customer has seen
  badgeCount: 0, // today's alerts newer than seenAtText
};

/** Load the first page of today's alerts (replaces the list). Skipped when fresh, unless `force`. */
export const fetchNotifications = createAsyncThunk(
  'notifications/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return await notificationsApi.getNotifications({ page: 1, perPage: PAGE_SIZE, dateFrom: bdTodayStartText() });
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

/** Load the next page of today's alerts and add it below the list. */
export const fetchMoreNotifications = createAsyncThunk(
  'notifications/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { currentPage } = getState().notifications;
      return await notificationsApi.getNotifications({
        page: currentPage + 1,
        perPage: PAGE_SIZE,
        dateFrom: bdTodayStartText(),
      });
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

/** Load the next page of alerts from before today (the first call opens the older section). */
export const fetchOlderNotifications = createAsyncThunk(
  'notifications/fetchOlder',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { olderPage } = getState().notifications;
      return await notificationsApi.getNotifications({
        page: olderPage + 1,
        perPage: PAGE_SIZE,
        dateTo: bdTodayStartText(),
      });
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { olderStatus, olderPage, olderLastPage } = getState().notifications;
      if (olderStatus === 'loading') {
        return false;
      }
      return olderPage === 0 || olderPage < olderLastPage;
    },
  },
);

/** How many of today's alerts the customer has not seen yet (a cheap request: one row, the server counts). */
export const fetchAlertBadge = createAsyncThunk(
  'notifications/fetchBadge',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { seenAtText } = getState().notifications;
      const dateFrom = laterText(bdTodayStartText(), seenAtText);
      const data = await notificationsApi.getNotifications({ page: 1, perPage: 1, dateFrom });
      return data && data.pagination ? Number(data.pagination.total) || 0 : 0;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** App start: read when the customer last looked at the alerts, then count what is new. */
export const loadAlertsSeenAt = createAsyncThunk('notifications/loadSeenAt', async (_, { dispatch }) => {
  const text = await readAlertsSeenAt();
  dispatch(seenAtLoaded(text));
  await dispatch(fetchAlertBadge());
  return text;
});

/** The customer is looking at the alerts: everything up to the newest loaded one is seen. */
export const markAlertsSeen = createAsyncThunk('notifications/markSeen', async (_, { getState }) => {
  const { items } = getState().notifications;
  const newest = items.length > 0 ? items[0].time : null;
  const seenAtText = newest ? addSecondToText(String(newest)) : bdNowText();
  await saveAlertsSeenAt(seenAtText);
  return seenAtText;
});

const notificationsSlice = createSlice({
  name: 'notifications',
  initialState,
  reducers: {
    seenAtLoaded(state, action) {
      state.seenAtText = action.payload || null;
    },
  },
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
        // A reload goes back to today's alerts only
        state.isShowingOlder = false;
        state.olderItems = [];
        state.olderPage = 0;
        state.olderLastPage = 1;
        state.olderStatus = 'idle';
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
      .addCase(fetchOlderNotifications.pending, (state) => {
        state.isShowingOlder = true;
        state.olderStatus = 'loading';
      })
      .addCase(fetchOlderNotifications.fulfilled, (state, action) => {
        const { items, pagination } = action.payload;
        const knownIds = new Set([...state.items, ...state.olderItems].map((item) => item.id));
        state.olderItems.push(...(items || []).filter((item) => !knownIds.has(item.id)));
        state.olderPage = pagination ? pagination.current_page : state.olderPage + 1;
        state.olderLastPage = pagination ? pagination.last_page : state.olderLastPage;
        state.olderStatus = 'succeeded';
      })
      .addCase(fetchOlderNotifications.rejected, (state) => {
        state.olderStatus = 'failed';
      })
      .addCase(fetchAlertBadge.fulfilled, (state, action) => {
        state.badgeCount = action.payload;
      })
      .addCase(markAlertsSeen.fulfilled, (state, action) => {
        state.seenAtText = action.payload;
        state.badgeCount = 0;
      })
      .addCase(logout, () => initialState);
  },
});

export const { seenAtLoaded } = notificationsSlice.actions;
export default notificationsSlice.reducer;

// Selectors
export const selectNotifications = (state) => state.notifications;
export const selectAlertBadgeCount = (state) => state.notifications.badgeCount;
