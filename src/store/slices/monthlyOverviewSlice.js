// The Monthly distance overview for the period and vehicles the customer asked for.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseMonthlyOverview } from '../../utils/monthlyOverview';
import { logout } from '../actions';

const PATH = '/reports/distance-report/monthly';
const MAX_VEHICLES = 500;

const initialState = {
  data: null, // parsed report, see parseMonthlyOverview
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Run the report.
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, fromTime: string, toTime: string }} filters
 *   vehicleId 0 = all vehicles
 */
export const fetchMonthlyOverview = createAsyncThunk('monthlyOverview/fetch', async (filters, { rejectWithValue }) => {
  try {
    const params = {
      from_date: filters.fromDate,
      to_date: filters.toDate,
      from_time: filters.fromTime,
      to_time: filters.toTime,
      limit: MAX_VEHICLES,
      page: 1,
    };
    if (filters.vehicleId) {
      params.device_id = filters.vehicleId;
    }
    if (filters.search && filters.search.trim()) {
      params.search_phrase = filters.search.trim();
    }
    const data = await getReport(PATH, params);
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return parseMonthlyOverview(data);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const monthlyOverviewSlice = createSlice({
  name: 'monthlyOverview',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchMonthlyOverview.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchMonthlyOverview.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchMonthlyOverview.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(logout, () => initialState);
  },
});

export default monthlyOverviewSlice.reducer;

// Selectors
export const selectMonthlyOverview = (state) => state.monthlyOverview;
