// Every alarm rule of the customer (all vehicles), with on / off, for the Alarm settings page in Profile.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as deviceAlertsApi from '../../api/deviceAlertsApi';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;

const initialState = {
  items: [], // [{ id, name, active, deviceCount }]
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  isSaving: false, // a switch or a bulk change is being sent
  error: null,
  lastFetchedAt: null,
};

/** Turn the server answer into simple rows. Accepts `items.alerts` or `items` as an array. */
export function parseAlerts(data) {
  const raw = data && data.items;
  const list = Array.isArray(raw) ? raw : (raw && raw.alerts) || [];
  return list.map((alert) => ({
    id: alert.id,
    name: alert.name || `Alarm ${alert.id}`,
    active: !!Number(alert.active),
    deviceCount: Array.isArray(alert.devices) ? alert.devices.length : null,
  }));
}

/** Load the rules. Skipped when fresh unless `force`. @param {{ force?: boolean }} [options] */
export const fetchAlarmSettings = createAsyncThunk(
  'alarmSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      return parseAlerts(await deviceAlertsApi.getAllAlerts());
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().alarmSettings;
      if (options.force) {
        return true;
      }
      if (status === 'loading') {
        return false;
      }
      return !(lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS);
    },
  },
);

/**
 * Switch several alarms on or off (one request each), then read the list back: the server decides.
 * Used by a single switch (one id) and by Select all / Unselect all.
 * @param {{ alertIds: number[], isActive: boolean }} request
 */
export const setAlarmsActive = createAsyncThunk(
  'alarmSettings/setActive',
  async ({ alertIds, isActive }, { dispatch, rejectWithValue }) => {
    try {
      await Promise.all(alertIds.map((alertId) => deviceAlertsApi.setAlertActive(alertId, isActive)));
      await dispatch(fetchAlarmSettings({ force: true })).unwrap();
      return { alertIds, isActive };
    } catch (error) {
      // Some may have changed before the failure, so read the list back anyway
      dispatch(fetchAlarmSettings({ force: true }));
      return rejectWithValue((error && error.message) || 'Could not change the alarms');
    }
  },
);

const alarmSettingsSlice = createSlice({
  name: 'alarmSettings',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchAlarmSettings.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(fetchAlarmSettings.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
        state.lastFetchedAt = Date.now();
      })
      .addCase(fetchAlarmSettings.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Could not load the alarms';
      })
      .addCase(setAlarmsActive.pending, (state) => {
        state.isSaving = true;
      })
      .addCase(setAlarmsActive.fulfilled, (state) => {
        state.isSaving = false;
      })
      .addCase(setAlarmsActive.rejected, (state) => {
        state.isSaving = false;
      })
      .addCase(logout, () => initialState);
  },
});

export default alarmSettingsSlice.reducer;

// Selectors
export const selectAlarmSettings = (state) => state.alarmSettings;
