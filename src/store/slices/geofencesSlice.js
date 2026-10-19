// Geofences: the customer's zones, which of them each vehicle uses (with its enter / leave alert), and saving.
// The server decides; after every change the app reads both lists back.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as geofencesApi from '../../api/geofencesApi';
import { buildEditPayload, buildGeofencePayload } from '../../utils/geofence';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;

const emptyLinks = { items: [], status: 'idle', error: null, lastFetchedAt: null };

const initialState = {
  zones: { byId: {}, status: 'idle', error: null, lastFetchedAt: null }, // GET /get_geofences
  linksByDevice: {}, // { [deviceId]: { items, status, error, lastFetchedAt } }  GET /vehicle-geofences
  saveStatus: 'idle', // 'idle' | 'saving' | 'succeeded' | 'failed'
  isDeleting: false,
};

/** Is this part fresh enough to skip the request? */
const isFresh = (part, options) => !options.force && part.lastFetchedAt && Date.now() - part.lastFetchedAt < STALE_AFTER_MS;

export const fetchGeofences = createAsyncThunk(
  'geofences/fetchGeofences',
  async (_, { rejectWithValue }) => {
    try {
      const data = await geofencesApi.getGeofences();
      const items = data && data.items;
      return Array.isArray(items) ? items : (items && items.geofences) || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const part = getState().geofences.zones;
      return part.status !== 'loading' && !isFresh(part, options);
    },
  },
);

/** @param {{ deviceId: number, force?: boolean }} request */
export const fetchVehicleGeofences = createAsyncThunk(
  'geofences/fetchVehicleGeofences',
  async ({ deviceId }, { rejectWithValue }) => {
    try {
      const data = await geofencesApi.getVehicleGeofences(deviceId);
      return { deviceId, items: data.items || [] };
    } catch (error) {
      return rejectWithValue({ deviceId, message: error.message });
    }
  },
  {
    condition: ({ deviceId, force }, { getState }) => {
      const part = getState().geofences.linksByDevice[deviceId] || emptyLinks;
      return part.status !== 'loading' && !isFresh(part, { force });
    },
  },
);

/**
 * Create or change a geofence and link it to the vehicle with its alert zone.
 * @param {{ deviceId: number, geofenceId: number|null, name: string, color: string,
 *   points: Array|null, circle?: { latitude, longitude, radius }|null, zone: 'in'|'out'|'both' }} request
 *   geofenceId null = new geofence. A circle is saved when `circle` is given, otherwise the polygon `points`;
 *   neither (edit only) = keep the shape.
 */
export const saveVehicleGeofence = createAsyncThunk(
  'geofences/saveVehicleGeofence',
  async ({ deviceId, geofenceId, name, color, points, circle = null, zone }, { dispatch, rejectWithValue }) => {
    let id = geofenceId;
    try {
      if (id) {
        await geofencesApi.editGeofence(buildEditPayload(id, name, points, color, circle));
      } else {
        const created = await geofencesApi.addGeofence(buildGeofencePayload(name, points, color, circle));
        if (!created || !created.item || !created.item.id) {
          return rejectWithValue((created && created.message) || 'Could not save the geofence');
        }
        id = created.item.id;
      }
    } catch (error) {
      return rejectWithValue(error.message);
    }
    try {
      await geofencesApi.linkVehicleGeofence({ deviceId, geofenceId: id, zone });
    } catch (error) {
      await dispatch(fetchGeofences({ force: true }));
      return rejectWithValue(`The geofence was saved, but the alert could not be set: ${error.message}`);
    }
    await Promise.all([dispatch(fetchGeofences({ force: true })), dispatch(fetchVehicleGeofences({ deviceId, force: true }))]);
    return { id };
  },
);

/** Remove the vehicle's alert and delete the geofence itself. */
export const deleteVehicleGeofence = createAsyncThunk(
  'geofences/deleteVehicleGeofence',
  async ({ deviceId, geofenceId }, { dispatch, rejectWithValue }) => {
    try {
      try {
        await geofencesApi.unlinkVehicleGeofence({ deviceId, geofenceId });
      } catch (error) {
        // Not linked (404) is fine: the geofence still has to go
      }
      await geofencesApi.destroyGeofence(geofenceId);
    } catch (error) {
      return rejectWithValue(error.message);
    }
    await Promise.all([dispatch(fetchGeofences({ force: true })), dispatch(fetchVehicleGeofences({ deviceId, force: true }))]);
    return { geofenceId };
  },
);

const geofencesSlice = createSlice({
  name: 'geofences',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchGeofences.pending, (state) => {
        state.zones.status = 'loading';
        state.zones.error = null;
      })
      .addCase(fetchGeofences.fulfilled, (state, action) => {
        const byId = {};
        action.payload.forEach((item) => {
          byId[item.id] = item;
        });
        state.zones = { byId, status: 'succeeded', error: null, lastFetchedAt: Date.now() };
      })
      .addCase(fetchGeofences.rejected, (state, action) => {
        state.zones.status = 'failed';
        state.zones.error = action.payload || 'Could not load the geofences';
      })
      .addCase(fetchVehicleGeofences.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.linksByDevice[deviceId] = { ...(state.linksByDevice[deviceId] || emptyLinks), status: 'loading', error: null };
      })
      .addCase(fetchVehicleGeofences.fulfilled, (state, action) => {
        const { deviceId, items } = action.payload;
        state.linksByDevice[deviceId] = { items, status: 'succeeded', error: null, lastFetchedAt: Date.now() };
      })
      .addCase(fetchVehicleGeofences.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        const message = (action.payload && action.payload.message) || 'Could not load the geofences';
        state.linksByDevice[deviceId] = { ...(state.linksByDevice[deviceId] || emptyLinks), status: 'failed', error: message };
      })
      .addCase(saveVehicleGeofence.pending, (state) => {
        state.saveStatus = 'saving';
      })
      .addCase(saveVehicleGeofence.fulfilled, (state) => {
        state.saveStatus = 'succeeded';
      })
      .addCase(saveVehicleGeofence.rejected, (state) => {
        state.saveStatus = 'failed';
      })
      .addCase(deleteVehicleGeofence.pending, (state) => {
        state.isDeleting = true;
      })
      .addCase(deleteVehicleGeofence.fulfilled, (state) => {
        state.isDeleting = false;
      })
      .addCase(deleteVehicleGeofence.rejected, (state) => {
        state.isDeleting = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default geofencesSlice.reducer;

// Selectors
export const selectGeofenceZones = (state) => state.geofences.zones;
export const selectVehicleLinks = (deviceId) => (state) => state.geofences.linksByDevice[deviceId] || emptyLinks;
export const selectIsSavingGeofence = (state) => state.geofences.saveStatus === 'saving';
export const selectIsDeletingGeofence = (state) => state.geofences.isDeleting;
