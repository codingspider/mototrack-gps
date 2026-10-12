// The Trip report of one vehicle and period. The totals cover the whole period; the trips come a page at a time and
// "Load more" adds the next page below (the server looks up two addresses for every trip of a page).
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import { getReport } from '../../api/reportsApi';
import { buildTripParams, parseTripReport } from '../../utils/tripReport';
import { logout } from '../actions';

const PATH = '/reports/distance-report/trip';
const PAGE_SIZE = 25;

const initialState = {
  data: null, // parsed report, see parseTripReport (rows of every loaded page)
  filters: null, // the filters of `data`, used by "Load more"
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (the first page)
  isLoadingMore: false,
  error: null,
};

/**
 * Run the report (first page).
 * @param {{ vehicleId: number, search: string, fromDate: string, toDate: string, fromTime: string, toTime: string }} filters
 */
export const fetchTripReport = createAsyncThunk('tripReport/fetch', async (filters, { rejectWithValue }) => {
  try {
    const data = await getReport(PATH, buildTripParams(filters, 1, PAGE_SIZE));
    if (data.status === 0) {
      return rejectWithValue(data.message || 'Could not load the report');
    }
    return { filters, data: parseTripReport(data) };
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** The next page of the report that is on the screen, added below. */
export const fetchMoreTripReport = createAsyncThunk(
  'tripReport/fetchMore',
  async (_, { getState, rejectWithValue }) => {
    try {
      const { filters, data } = getState().tripReport;
      return parseTripReport(await getReport(PATH, buildTripParams(filters, data.page + 1, PAGE_SIZE)));
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { data, status, isLoadingMore } = getState().tripReport;
      return !!data && status === 'succeeded' && !isLoadingMore && data.page < data.lastPage;
    },
  },
);

const tripReportSlice = createSlice({
  name: 'tripReport',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchTripReport.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchTripReport.fulfilled, (state, action) => {
        state.data = action.payload.data;
        state.filters = action.payload.filters;
        state.status = 'succeeded';
      })
      .addCase(fetchTripReport.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the report';
      })
      .addCase(fetchMoreTripReport.pending, (state) => {
        state.isLoadingMore = true;
      })
      .addCase(fetchMoreTripReport.fulfilled, (state, action) => {
        state.data.rows.push(...action.payload.rows);
        state.data.page = action.payload.page;
        state.data.lastPage = action.payload.lastPage;
        state.isLoadingMore = false;
      })
      .addCase(fetchMoreTripReport.rejected, (state) => {
        state.isLoadingMore = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default tripReportSlice.reducer;

// Selectors
export const selectTripReport = (state) => state.tripReport;
