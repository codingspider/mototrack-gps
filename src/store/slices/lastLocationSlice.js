// The Last location report for the vehicles and last-location range the customer asked for. The server looks up an
// address for each vehicle of a page, so vehicles come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseLastLocationReport } from '../../utils/lastLocationReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/lastlocation';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseLastLocationReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

const paramsOf = (filters, page) => {
  const params = { range: filters.range, limit: PAGE_SIZE, page };
  if (filters.range === 'custom') {
    params.from_date = filters.fromDate;
    params.to_date = filters.toDate;
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
 * @param {{ range: string, fromDate: string, toDate: string, vehicleId: number, search: string }} filters
 */
export const fetchLastLocation = createAsyncThunk('lastLocation/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0 || data.success === false) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseLastLocationReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreLastLocation = createAsyncThunk(
  'lastLocation/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().lastLocation;
      return parseLastLocationReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().lastLocation;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const lastLocationSlice = createSlice({
  name: 'lastLocation',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLastLocation.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchLastLocation.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchLastLocation.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreLastLocation.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreLastLocation.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreLastLocation.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default lastLocationSlice.reducer;

// Selectors
export const selectLastLocation = (state) => state.lastLocation;
