// The route history (playback) that is on screen: which vehicle and range, and its recorded points.
// Only one range is kept at a time; asking for another range replaces it.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as playbackApi from '../../api/playbackApi';
import { rangeKey } from '../../utils/playbackRange';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;

const initialState = {
  key: null, // deviceId + range, tells which request the points belong to
  points: [],
  truncated: false, // the server had more points than it sent
  total: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  requestId: null, // the newest request; answers of older ones are ignored
  lastFetchedAt: null,
};

/** @param {object} request { deviceId, fromDate, toDate, fromTime, toTime, force } */
export const fetchPlayback = createAsyncThunk(
  'playback/fetchPlayback',
  async (request, { rejectWithValue }) => {
    try {
      const data = await playbackApi.getPlayback(request);
      if (data.status === 0) {
        return rejectWithValue(data.message || 'Could not load the route');
      }
      return { points: data.points || [], truncated: !!data.truncated, total: data.total || 0 };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (request, { getState }) => {
      const { key, status, lastFetchedAt } = getState().playback;
      if (request.force) {
        return true;
      }
      const isSameRange = key === rangeKey(request.deviceId, request);
      if (isSameRange && status === 'loading') {
        return false;
      }
      const isFresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS;
      return !(isSameRange && status === 'succeeded' && isFresh);
    },
  },
);

const playbackSlice = createSlice({
  name: 'playback',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlayback.pending, (state, action) => {
        state.key = rangeKey(action.meta.arg.deviceId, action.meta.arg);
        state.requestId = action.meta.requestId;
        state.status = 'loading';
        state.error = null;
        state.points = [];
      })
      .addCase(fetchPlayback.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.requestId) {
          return; // a newer request replaced this one
        }
        state.status = 'succeeded';
        state.points = action.payload.points;
        state.truncated = action.payload.truncated;
        state.total = action.payload.total;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchPlayback.rejected, (state, action) => {
        if (action.meta.requestId !== state.requestId) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload || 'Could not load the route';
      })
      .addCase(logout, () => initialState);
  },
});

export default playbackSlice.reducer;

// Selectors
export const selectPlayback = (state) => state.playback;
