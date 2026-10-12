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

// A position that differs by less than this (about a metre) is the same place: GPS noise is not a move
const MOVE_EPSILON = 0.00001;

const STALE_AFTER_MS = 60 * 1000; // re-fetch list if older than 1 minute
const WARRANTY_STALE_AFTER_MS = 10 * 60 * 1000; // warranty rarely changes

// The adapter stores vehicles as { ids: [], entities: { [id]: vehicle } }
// and gives us ready-made update helpers, which suits updates by id from the socket.
const vehiclesAdapter = createEntityAdapter();

const initialState = vehiclesAdapter.getInitialState({
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetchedAt: null,
  recentMovesFetchedAt: null, // when the "moved in the last hours" times were last asked from the server
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

const RECENT_MOVES_STALE_AFTER_MS = 60 * 1000;
const RECENT_MOVES_HOURS = 3;

/**
 * When did each vehicle last move (in the last 3 hours)? Asked from the server, which reads the positions, so it works
 * for trackers that never set a "moved" time. The answer is written onto the vehicles as `last_moved_stamp`.
 * Home "Recent Activities" uses it. Skipped when it was asked less than a minute ago, unless `force`.
 */
export const fetchRecentMoves = createAsyncThunk(
  'vehicles/fetchRecentMoves',
  async (_, { rejectWithValue }) => {
    try {
      const data = await vehiclesApi.getRecentActivity(RECENT_MOVES_HOURS);
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { recentMovesFetchedAt } = getState().vehicles;
      if (options.force) {
        return true;
      }
      return !(recentMovesFetchedAt && Date.now() - recentMovesFetchedAt < RECENT_MOVES_STALE_AFTER_MS);
    },
  },
);

/** Full details of one vehicle (GET /vehicle-details). Stored on the vehicle itself, so nothing is copied. */
export const fetchVehicleDetails = createAsyncThunk(
  'vehicles/fetchVehicleDetails',
  async ({ id }, { rejectWithValue }) => {
    try {
      const data = await vehiclesApi.getVehicleDetails(id);
      return { id, details: data.item };
    } catch (error) {
      return rejectWithValue({ id, message: error.message });
    }
  },
  {
    condition: ({ id, force }, { getState }) => {
      const vehicle = getState().vehicles.entities[id];
      if (!vehicle || vehicle.detailsStatus === 'loading') {
        return false;
      }
      if (force) {
        return true;
      }
      const isFresh = vehicle.detailsFetchedAt && Date.now() - vehicle.detailsFetchedAt < STALE_AFTER_MS;
      return !isFresh;
    },
  },
);

/** Warranty of one vehicle (GET /warranty-check). Stored on the vehicle, like its details. */
export const fetchVehicleWarranty = createAsyncThunk(
  'vehicles/fetchVehicleWarranty',
  async ({ id }, { rejectWithValue }) => {
    try {
      const data = await vehiclesApi.getWarranty(id);
      return { id, warranty: data.item };
    } catch (error) {
      return rejectWithValue({ id, message: error.message });
    }
  },
  {
    condition: ({ id, force }, { getState }) => {
      const vehicle = getState().vehicles.entities[id];
      if (!vehicle || vehicle.warrantyStatus === 'loading') {
        return false;
      }
      if (force) {
        return true;
      }
      const isFresh = vehicle.warrantyFetchedAt && Date.now() - vehicle.warrantyFetchedAt < WARRANTY_STALE_AFTER_MS;
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
      // Remember when the location last changed (Home "Recent Activities" looks at the last 3 hours)
      const hasChangedPlace =
        Math.abs(Number(position.lat) - Number(vehicle.lat)) > MOVE_EPSILON ||
        Math.abs(Number(position.lng) - Number(vehicle.lng)) > MOVE_EPSILON;
      if (hasChangedPlace || position.speed > 0) {
        vehicle.last_moved_stamp = Math.floor(Date.now() / 1000);
      }
      vehicle.lat = position.lat;
      vehicle.lng = position.lng;
      vehicle.live_speed = position.speed;
      vehicle.course = position.course;
      // The socket `timestamp` is 6 hours behind real time (the server sends Bangladesh clock time as if it
      // were UTC), so for a live event we use the moment it arrived. See the backend note in CLAUDE.md.
      vehicle.last_position_stamp = Math.floor(Date.now() / 1000);
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
        // A list refresh must not erase what we already loaded onto each vehicle
        // (its details and its heading from the socket), so carry those over.
        const refreshedVehicles = action.payload.map((vehicle) => {
          const existing = state.entities[vehicle.id];
          if (!existing) {
            return vehicle;
          }
          return {
            ...vehicle,
            // keep a newer "moved" time that came from the live socket
            last_moved_stamp:
              vehicle.last_moved_stamp === undefined
                ? existing.last_moved_stamp
                : Math.max(Number(vehicle.last_moved_stamp) || 0, Number(existing.last_moved_stamp) || 0) || null,
            course: vehicle.course ?? existing.course,
            details: existing.details,
            detailsStatus: existing.detailsStatus,
            detailsError: existing.detailsError,
            detailsFetchedAt: existing.detailsFetchedAt,
            warranty: existing.warranty,
            warrantyStatus: existing.warrantyStatus,
            warrantyFetchedAt: existing.warrantyFetchedAt,
          };
        });
        vehiclesAdapter.setAll(state, refreshedVehicles);
      })
      .addCase(fetchVehicles.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load vehicles';
      })
      .addCase(fetchVehicleDetails.pending, (state, action) => {
        const vehicle = state.entities[action.meta.arg.id];
        if (vehicle) {
          vehicle.detailsStatus = 'loading';
          vehicle.detailsError = null;
        }
      })
      .addCase(fetchVehicleDetails.fulfilled, (state, action) => {
        const vehicle = state.entities[action.payload.id];
        if (vehicle) {
          vehicle.details = action.payload.details;
          vehicle.detailsStatus = 'succeeded';
          vehicle.detailsFetchedAt = Date.now();
        }
      })
      .addCase(fetchVehicleDetails.rejected, (state, action) => {
        const vehicle = state.entities[action.meta.arg.id];
        if (vehicle) {
          vehicle.detailsStatus = 'failed';
          vehicle.detailsError = action.payload?.message || 'Could not load vehicle details';
        }
      })
      .addCase(fetchRecentMoves.fulfilled, (state, action) => {
        state.recentMovesFetchedAt = Date.now();
        action.payload.forEach((item) => {
          const vehicle = state.entities[item.id];
          if (vehicle) {
            // keep a newer time that came from the live socket
            vehicle.last_moved_stamp = Math.max(Number(vehicle.last_moved_stamp) || 0, Number(item.last_moved_stamp) || 0);
          }
        });
      })
      .addCase(fetchVehicleWarranty.pending, (state, action) => {
        const vehicle = state.entities[action.meta.arg.id];
        if (vehicle) {
          vehicle.warrantyStatus = 'loading';
        }
      })
      .addCase(fetchVehicleWarranty.fulfilled, (state, action) => {
        const vehicle = state.entities[action.payload.id];
        if (vehicle) {
          vehicle.warranty = action.payload.warranty;
          vehicle.warrantyStatus = 'succeeded';
          vehicle.warrantyFetchedAt = Date.now();
        }
      })
      .addCase(fetchVehicleWarranty.rejected, (state, action) => {
        const vehicle = state.entities[action.meta.arg.id];
        if (vehicle) {
          vehicle.warrantyStatus = 'failed';
        }
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