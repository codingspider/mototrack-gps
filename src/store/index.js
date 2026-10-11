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
import overspeedReducer from './slices/overspeedSlice';
import paymentsReducer from './slices/paymentsSlice';
import notificationsReducer from './slices/notificationsSlice';
import commandsReducer from './slices/commandsSlice';
import reportSummaryReducer from './slices/reportSummarySlice';
import fuelSettingsReducer from './slices/fuelSettingsSlice';
import routeReducer from './slices/routeSlice';
import deviceAlertsReducer from './slices/deviceAlertsSlice';

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
    overspeed: overspeedReducer,
    payments: paymentsReducer,
    notifications: notificationsReducer,
    commands: commandsReducer,
    reportSummary: reportSummaryReducer,
    fuelSettings: fuelSettingsReducer,
    route: routeReducer,
    deviceAlerts: deviceAlertsReducer,
  },
});

export default store;