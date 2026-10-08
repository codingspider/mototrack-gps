// Geofences. For now only creating one (drawn on the vehicle map); listing and assigning come later.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as geofencesApi from '../../api/geofencesApi';
import { logout } from '../actions';

const initialState = {
  saveStatus: 'idle', // 'idle' | 'saving' | 'succeeded' | 'failed'
  error: null,
};

/** Save a geofence drawn on the map. Rejects with a friendly message if the server says no. */
export const createGeofence = createAsyncThunk('geofences/createGeofence', async (payload, { rejectWithValue }) => {
  try {
    const data = await geofencesApi.addGeofence(payload);
    if (data && data.status === 0) {
      return rejectWithValue(data.message || 'Could not save the geofence');
    }
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const geofencesSlice = createSlice({
  name: 'geofences',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(createGeofence.pending, (state) => {
        state.saveStatus = 'saving';
        state.error = null;
      })
      .addCase(createGeofence.fulfilled, (state) => {
        state.saveStatus = 'succeeded';
      })
      .addCase(createGeofence.rejected, (state, action) => {
        state.saveStatus = 'failed';
        state.error = action.payload || 'Could not save the geofence';
      })
      .addCase(logout, () => initialState);
  },
});

export default geofencesSlice.reducer;

// Selectors
export const selectIsSavingGeofence = (state) => state.geofences.saveStatus === 'saving';
