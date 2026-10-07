// The Redux store: every slice is registered here.
import { configureStore } from '@reduxjs/toolkit';
import authReducer from './slices/authSlice';
import vehiclesReducer from './slices/vehiclesSlice';
import profileReducer from './slices/profileSlice';
import appReducer from './slices/appSlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    vehicles: vehiclesReducer,
    profile: profileReducer,
    app: appReducer,
  },
});

export default store;