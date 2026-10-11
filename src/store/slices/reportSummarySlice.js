// The one-vehicle report summary on screen (Trips, Parking, Engine, Speed, Fuel). It asks the existing report
// endpoints in parallel; a report that fails only blanks its own numbers.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as reportsApi from '../../api/reportsApi';
import { buildReportSummary, buildSummaryRequests } from '../../utils/reportSummary';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;

const initialState = {
  key: null, // `${vehicleId}:${preset}` of the data below
  loadingKey: null, // the vehicle and range being asked for right now
  data: null, // result of buildReportSummary
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetchedAt: null,
};

/** @param {{ vehicleId: number, preset: 'today'|'yesterday'|'week', force?: boolean }} request */
export const fetchReportSummary = createAsyncThunk(
  'reportSummary/fetch',
  async ({ vehicleId, preset }, { rejectWithValue }) => {
    const requests = buildSummaryRequests(vehicleId, preset);
    const results = await Promise.allSettled(requests.map((request) => reportsApi.getReport(request.path, request.params)));
    const answers = {};
    let firstError = null;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled') {
        const data = result.value;
        const hasFailed = data && (data.status === 0 || data.success === false);
        answers[requests[index].key] = hasFailed ? null : data;
        return;
      }
      answers[requests[index].key] = null;
      firstError = firstError || result.reason.message;
    });
    // Nothing came back at all: show the error screen, not a page of dashes
    if (Object.values(answers).every((answer) => answer === null)) {
      return rejectWithValue(firstError || 'Could not load the report');
    }
    return { key: `${vehicleId}:${preset}`, data: buildReportSummary(answers) };
  },
  {
    condition: ({ vehicleId, preset, force }, { getState }) => {
      const state = getState().reportSummary;
      const requestedKey = `${vehicleId}:${preset}`;
      // The same request is already running; a different vehicle or range may start (and replaces it)
      if (state.status === 'loading' && state.loadingKey === requestedKey) {
        return false;
      }
      const isSame = state.key === requestedKey;
      const isFresh = isSame && state.lastFetchedAt && Date.now() - state.lastFetchedAt < STALE_AFTER_MS;
      return !!force || !isFresh;
    },
  },
);

const reportSummarySlice = createSlice({
  name: 'reportSummary',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReportSummary.pending, (state, action) => {
        const { vehicleId, preset } = action.meta.arg;
        const key = `${vehicleId}:${preset}`;
        state.status = 'loading';
        state.loadingKey = key;
        state.error = null;
        if (state.key !== key) {
          state.data = null; // another vehicle or range: do not show the old numbers under the new title
        }
      })
      .addCase(fetchReportSummary.fulfilled, (state, action) => {
        if (action.payload.key !== state.loadingKey) {
          return; // a newer vehicle or range replaced this one
        }
        state.status = 'succeeded';
        state.key = action.payload.key;
        state.data = action.payload.data;
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchReportSummary.rejected, (state, action) => {
        const { vehicleId, preset } = action.meta.arg;
        if (`${vehicleId}:${preset}` !== state.loadingKey) {
          return;
        }
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(logout, () => initialState);
  },
});

export default reportSummarySlice.reducer;

// Selectors
export const selectReportSummary = (state) => state.reportSummary;
