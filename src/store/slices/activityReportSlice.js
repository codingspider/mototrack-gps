// The Vehicle activity report for the vehicles and dates the customer asked for. Addresses are looked up per page on
// the server, so vehicles come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseActivityReport } from '../../utils/activityReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/activity';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseActivityReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

const paramsOf = (filters, page) => {
  const params = {
    from_date: filters.fromDate,
    to_date: filters.toDate,
    min_distance: Number(filters.minDistance) || 0,
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
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, minDistance: string }} filters
 */
export const fetchActivityReport = createAsyncThunk('activityReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0 || data.success === false) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseActivityReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreActivityReport = createAsyncThunk(
  'activityReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().activityReport;
      return parseActivityReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().activityReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const activityReportSlice = createSlice({
  name: 'activityReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchActivityReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchActivityReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchActivityReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreActivityReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreActivityReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreActivityReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default activityReportSlice.reducer;

// Selectors
export const selectActivityReport = (state) => state.activityReport;
