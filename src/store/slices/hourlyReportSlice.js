// The Hourly report for the vehicles, dates and time of day the customer asked for.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseHourlyReport } from '../../utils/hourlyReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/hourly';
const MAX_ROWS = 1000; // the period is at most 62 days of 24 hours

const initialState = {
  data: null, // parsed report, see parseHourlyReport
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Run the report.
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, timeRange: string }} filters
 *   vehicleId 0 = all vehicles, timeRange like '06:00-12:00'
 */
export const fetchHourlyReport = createAsyncThunk('hourlyReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const params = {
      from_date: filters.fromDate,
      to_date: filters.toDate,
      time_range: filters.timeRange,
      limit: MAX_ROWS,
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
    return parseHourlyReport(data);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const hourlyReportSlice = createSlice({
  name: 'hourlyReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchHourlyReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchHourlyReport.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchHourlyReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(logout, () => initialState);
  },
});

export default hourlyReportSlice.reducer;

// Selectors
export const selectHourlyReport = (state) => state.hourlyReport;
