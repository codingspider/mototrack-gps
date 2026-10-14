// The alarm rules of the customer, with on / off, for the Alarm settings page in Profile. The page shows only the
// account alarms (see isAccountAlarm); the names of the switched-off ones are also used to hide their alerts.
import { createAsyncThunk, createSelector, createSlice } from '@reduxjs/toolkit';
import * as deviceAlertsApi from '../../api/deviceAlertsApi';
import { getDisabledAlarmNames, isAccountAlarm } from '../../utils/alarmSettings';
import { loadDisabledAlarmNames, saveDisabledAlarmNames } from '../../utils/alarmStorage';
import { logout } from '../actions';

const STALE_AFTER_MS = 60 * 1000;

const initialState = {
  items: [], // [{ id, name, type, active, deviceCount }] every rule the server sent
  cachedDisabledNames: [], // names saved on the phone: used until the list is loaded
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
    type: alert.type || '',
    active: !!Number(alert.active),
    deviceCount: Array.isArray(alert.devices) ? alert.devices.length : null,
  }));
}

/** Load the rules. Skipped when fresh unless `force`. @param {{ force?: boolean }} [options] */
export const fetchAlarmSettings = createAsyncThunk(
  'alarmSettings/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const rows = parseAlerts(await deviceAlertsApi.getAllAlerts());
      // Remember which alarms are off, so their alerts stay hidden on the next start and while the app is closed
      saveDisabledAlarmNames(getDisabledAlarmNames(rows));
      return rows;
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

/** App start: read the names of the switched-off alarms that were saved on the phone. */
export const loadCachedAlarmNames = createAsyncThunk('alarmSettings/loadCachedNames', async () => loadDisabledAlarmNames());

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
      .addCase(loadCachedAlarmNames.fulfilled, (state, action) => {
        state.cachedDisabledNames = action.payload;
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
export const selectAccountAlarms = createSelector(
  [(state) => state.alarmSettings.items],
  (items) => items.filter(isAccountAlarm),
);

/** Lower case names of the switched-off account alarms (from the saved names until the list is loaded). */
export const selectDisabledAlarmNames = createSelector(
  [(state) => state.alarmSettings.items, (state) => state.alarmSettings.cachedDisabledNames],
  (items, cachedNames) => (items.length > 0 ? getDisabledAlarmNames(items) : cachedNames),
);
