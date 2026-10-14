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
import alarmSettingsReducer from './slices/alarmSettingsSlice';
import addressReducer from './slices/addressSlice';
import shareReducer from './slices/shareSlice';
import dailyActivityReducer from './slices/dailyActivitySlice';
import monthlyOverviewReducer from './slices/monthlyOverviewSlice';
import hourlyReportReducer from './slices/hourlyReportSlice';
import locationReportReducer from './slices/locationReportSlice';
import speedReportReducer from './slices/speedReportSlice';
import lastLocationReducer from './slices/lastLocationSlice';
import activityReportReducer from './slices/activityReportSlice';
import movementReportReducer from './slices/movementReportSlice';
import engineReportReducer from './slices/engineReportSlice';
import fuelAlertReportReducer from './slices/fuelAlertReportSlice';
import tripReportReducer from './slices/tripReportSlice';
import legalReducer from './slices/legalSlice';
import refreshCarReducer from './slices/refreshCarSlice';
import warrantyReducer from './slices/warrantySlice';

const store = configureStore({
  reducer: {
    auth: authReducer,
    refreshCar: refreshCarReducer,
    warranty: warrantyReducer,
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
    alarmSettings: alarmSettingsReducer,
    address: addressReducer,
    share: shareReducer,
    dailyActivity: dailyActivityReducer,
    monthlyOverview: monthlyOverviewReducer,
    hourlyReport: hourlyReportReducer,
    locationReport: locationReportReducer,
    speedReport: speedReportReducer,
    lastLocation: lastLocationReducer,
    activityReport: activityReportReducer,
    movementReport: movementReportReducer,
    engineReport: engineReportReducer,
    fuelAlertReport: fuelAlertReportReducer,
    tripReport: tripReportReducer,
    legal: legalReducer,
  },
});

export default store;