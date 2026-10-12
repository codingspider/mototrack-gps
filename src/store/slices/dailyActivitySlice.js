// The Daily activity report of the vehicle and period the customer asked for (rows, totals and the generated time).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { parseDailyActivity } from '../../utils/dailyActivity';
import { logout } from '../actions';

const PATH = '/reports/distance-report/daily';
const MAX_ROWS = 100; // the period is at most 62 days, so one page holds it all

const initialState = {
  data: null, // parsed report, see parseDailyActivity
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/**
 * Run the report.
 * @param {{ vehicleId: number, fromDate: string, toDate: string, fromTime: string, toTime: string }} filters
 */
export const fetchDailyActivity = createAsyncThunk('dailyActivity/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, {
      device_id: filters.vehicleId,
      start_date: filters.fromDate,
      end_date: filters.toDate,
      start_time: filters.fromTime,
      end_time: filters.toTime,
      limit: MAX_ROWS,
      page: 1,
    });
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return parseDailyActivity(data);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const dailyActivitySlice = createSlice({
  name: 'dailyActivity',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchDailyActivity.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchDailyActivity.fulfilled, (state, action) => {
        state.data = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchDailyActivity.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(logout, () => initialState);
  },
});

export default dailyActivitySlice.reducer;

// Selectors
export const selectDailyActivity = (state) => state.dailyActivity;
