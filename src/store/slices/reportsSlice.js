// The report on screen for each report type: its summary cards, rows and paging. Reports are asked for by the
// user (Run report), so there is no "fresh enough" skipping here; the newest answer replaces the old one.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as reportsApi from '../../api/reportsApi';
import { getPresetRange } from '../../utils/playbackRange';
import { getReportConfig } from '../../utils/reportConfigs';
import { logout } from '../actions';

const emptyReport = { status: 'idle', error: null, summary: [], rows: [], note: '', pagination: { page: 1, lastPage: 1, total: 0 }, requestId: null };

/** @param {object} request { type: 'daily', filters: {...}, page: 1 } */
export const fetchReport = createAsyncThunk('reports/fetchReport', async ({ type, filters, page = 1 }, { rejectWithValue }) => {
  const config = getReportConfig(type);
  try {
    const data = await reportsApi.getReport(config.path, config.buildParams(filters, page, config.pageSize));
    if (data.status === 0 || data.success === false) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    const today = getPresetRange('today').fromDate;
    return { type, page, ...config.parse(data, filters, today) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const reportsSlice = createSlice({
  name: 'reports',
  initialState: { byType: {} },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchReport.pending, (state, action) => {
        const { type, page = 1 } = action.meta.arg;
        const current = state.byType[type] || emptyReport;
        // Page 1 starts over (rows cleared); a later page keeps the rows and adds to them
        state.byType[type] = page === 1 ? { ...emptyReport, status: 'loading', requestId: action.meta.requestId } : { ...current, status: 'loading', requestId: action.meta.requestId };
      })
      .addCase(fetchReport.fulfilled, (state, action) => {
        const { type, page, summary, rows, note, pagination } = action.payload;
        const current = state.byType[type];
        if (!current || current.requestId !== action.meta.requestId) {
          return; // a newer request replaced this one
        }
        state.byType[type] = {
          ...current,
          status: 'succeeded',
          summary,
          note: note || '',
          pagination,
          rows: page === 1 ? rows : [...current.rows, ...rows],
        };
      })
      .addCase(fetchReport.rejected, (state, action) => {
        const { type } = action.meta.arg;
        const current = state.byType[type];
        if (!current || current.requestId !== action.meta.requestId) {
          return;
        }
        current.status = 'failed';
        current.error = action.payload || 'Could not load the report';
      })
      .addCase(logout, () => ({ byType: {} }));
  },
});

export default reportsSlice.reducer;

// Selectors
export const selectReport = (type) => (state) => state.reports.byType[type] || emptyReport;
