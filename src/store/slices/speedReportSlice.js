// The Speed report for the vehicles, dates and time of day the customer asked for. The chart and the summary cover the
// whole period; the table rows come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseSpeedReport } from '../../utils/speedReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/speed';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseSpeedReport (rows of every loaded page)
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
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, timeRange: string }} filters
 */
export const fetchSpeedReport = createAsyncThunk('speedReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseSpeedReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreSpeedReport = createAsyncThunk(
  'speedReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().speedReport;
      return parseSpeedReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().speedReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const speedReportSlice = createSlice({
  name: 'speedReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchSpeedReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchSpeedReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchSpeedReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreSpeedReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreSpeedReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreSpeedReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default speedReportSlice.reducer;

// Selectors
export const selectSpeedReport = (state) => state.speedReport;
