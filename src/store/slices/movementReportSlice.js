// The Movement summary report for the vehicles and dates the customer asked for. Addresses are looked up per page on
// the server, so the rows come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseMovementReport } from '../../utils/movementReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/movement-summary';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseMovementReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

const paramsOf = (filters, page) => {
  const params = { from_date: filters.fromDate, to_date: filters.toDate, limit: PAGE_SIZE, page };
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
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string }} filters
 */
export const fetchMovementReport = createAsyncThunk('movementReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0 || data.success === false) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseMovementReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreMovementReport = createAsyncThunk(
  'movementReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().movementReport;
      return parseMovementReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().movementReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const movementReportSlice = createSlice({
  name: 'movementReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMovementReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMovementReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchMovementReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreMovementReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreMovementReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreMovementReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default movementReportSlice.reducer;

// Selectors
export const selectMovementReport = (state) => state.movementReport;
