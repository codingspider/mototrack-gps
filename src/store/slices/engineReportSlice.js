// The Engine report for the vehicles, dates, time of day and status the customer asked for. The totals cover the
// whole period; the rows come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseEngineReport } from '../../utils/engineReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/engine/report';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseEngineReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

const paramsOf = (filters, page) => {
  const params = {
    date: filters.fromDate,
    to_date: filters.toDate,
    time_range: filters.timeRange,
    limit: PAGE_SIZE,
    page,
  };
  if (filters.status && filters.status !== 'all') {
    params.status = filters.status;
  }
  if (filters.vehicleId) {
    params.device_id = filters.vehicleId;
  }
  if (filters.search && filters.search.trim()) {
    params.search_phrase = filters.search.trim();
  }
  return params;
};

/**
 * Run the report (first page).
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, timeRange: string, status: string }} filters
 *   status: 'all' | 'on' | 'off' | 'idle'
 */
export const fetchEngineReport = createAsyncThunk('engineReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseEngineReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreEngineReport = createAsyncThunk(
  'engineReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().engineReport;
      return parseEngineReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().engineReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const engineReportSlice = createSlice({
  name: 'engineReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchEngineReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchEngineReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchEngineReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreEngineReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreEngineReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreEngineReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default engineReportSlice.reducer;

// Selectors
export const selectEngineReport = (state) => state.engineReport;
