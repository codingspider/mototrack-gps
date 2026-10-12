// The Fuel alert report for the vehicles, period and alert type the customer asked for. The totals cover the whole
// period; the rows come a page at a time and "Load more" adds the next page below.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseFuelAlertReport } from '../../utils/fuelAlertReport';
import { logout } from '../actions';

const PATH = '/reports/fuel-alert-report';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseFuelAlertReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

const paramsOf = (filters, page) => {
  const params = {
    from_date: filters.fromDate,
    to_date: filters.toDate,
    from_time: filters.fromTime,
    to_time: filters.toTime,
    limit: PAGE_SIZE,
    page,
  };
  if (filters.status) {
    params.alert_type = filters.status;
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
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, fromTime: string, toTime: string,
 *   status: string }} filters  status = the alert type ('' = all fuel alerts)
 */
export const fetchFuelAlertReport = createAsyncThunk('fuelAlertReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, paramsOf(filters, 1));
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseFuelAlertReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreFuelAlertReport = createAsyncThunk(
  'fuelAlertReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().fuelAlertReport;
      return parseFuelAlertReport(await getReport(PATH, paramsOf(filters, data.page + 1)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().fuelAlertReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const fuelAlertReportSlice = createSlice({
  name: 'fuelAlertReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchFuelAlertReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchFuelAlertReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchFuelAlertReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreFuelAlertReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreFuelAlertReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreFuelAlertReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default fuelAlertReportSlice.reducer;

// Selectors
export const selectFuelAlertReport = (state) => state.fuelAlertReport;
