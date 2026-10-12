// The Location report for the vehicles, dates and time of day the customer asked for. The server looks up an
// address for each point, so the points come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseLocationReport } from '../../utils/locationReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/location';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseLocationReport (rows of every loaded page)
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
export const fetchLocationReport = createAsyncThunk('locationReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseLocationReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreLocationReport = createAsyncThunk(
  'locationReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().locationReport;
      const next = parseLocationReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
      return next;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().locationReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const locationReportSlice = createSlice({
  name: 'locationReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLocationReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLocationReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchLocationReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreLocationReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreLocationReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreLocationReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default locationReportSlice.reducer;

// Selectors
export const selectLocationReport = (state) => state.locationReport;
