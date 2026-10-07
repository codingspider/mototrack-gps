// All vehicles + their live positions. Dashboard, map and lists read from here.
import {
  createAsyncThunk,
  createEntityAdapter,
  createSelector,
  createSlice,
} from '@reduxjs/toolkit';
import * as vehiclesApi from '../../api/vehiclesApi';
import { getStatusAfterPosition, getStatusGroup } from '../../utils/vehicleStatus';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000; // re-fetch list if older than 1 minute

// The adapter stores vehicles as { ids: [], entities: { [id]: vehicle } }
// and gives us ready-made update helpers, which suits updates by id from the socket.
const vehiclesAdapter = createEntityAdapter();

const initialState = vehiclesAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetchedAt: null,
});

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (_, { rejectWithValue }) => {
    try {
      const data = await vehiclesApi.getVehicles();
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    // Skip the request if we already have fresh data or a request is running.
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().vehicles;
      if (status === 'loading') {
        return false;
      }
      if (options.force) {
        return true; // pull-to-refresh
      }
      const isFresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS;
      return !isFresh;
    },
  },
);

const vehiclesSlice = createSlice({
  name: 'vehicles',
  initialState,
  reducers: {
    // Socket 'position' event: { id, lat, lng, speed, course, online, timestamp }
    vehiclePositionReceived(state, action) {
      const position = action.payload;
      const vehicle = state.entities[position.id];
      if (!vehicle) {
        return; // unknown vehicle, ignore
      }
      vehicle.lat = position.lat;
      vehicle.lng = position.lng;
      vehicle.live_speed = position.speed;
      vehicle.course = position.course;
      vehicle.last_position_stamp = position.timestamp;
      vehicle.status = getStatusAfterPosition(vehicle.status, position.speed, position.online);
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchVehicles.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchVehicles.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.lastFetchedAt = Date.now();
        vehiclesAdapter.setAll(state, action.payload);
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load vehicles';
      })
      .addCase(logout, () => initialState);
  },
});

export const { vehiclePositionReceived } = vehiclesSlice.actions;
export default vehiclesSlice.reducer;

// Selectors
const selectors = vehiclesAdapter.getSelectors((state) => state.vehicles);
export const selectAllVehicles = selectors.selectAll;
export const selectVehicleById = (id) => (state) => selectors.selectById(state, id);
export const selectVehiclesStatus = (state) => state.vehicles.status;
export const selectVehiclesError = (state) => state.vehicles.error;

/** Totals for the dashboard: { total, moving, idle, offline, suspended } */
export const selectVehicleCounts = createSelector([selectAllVehicles], (vehicles) => {
  const counts = { total: vehicles.length, moving: 0, idle: 0, offline: 0, suspended: 0 };
  vehicles.forEach((vehicle) => {
    counts[getStatusGroup(vehicle.status)] += 1;
  });
  return counts;
});