// The Redux store: every slice is registered here.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import profileReducer from './slices/profileSlice';
import appReducer from './slices/appSlice';
import toastReducer from './slices/toastSlice';
import geofencesReducer from './slices/geofencesSlice';
import playbackReducer from './slices/playbackSlice';
import reportsReducer from './slices/reportsSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    profile: profileReducer,
    app: appReducer,
    toast: toastReducer,
    geofences: geofencesReducer,
    playback: playbackReducer,
    reports: reportsReducer,
  },
});

export default store;