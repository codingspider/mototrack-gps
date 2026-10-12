// The live share link of each vehicle (url and when it stops working). The server owns the expiry.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as shareApi from '../../api/shareApi';
import { logout } from '../actions';

const emptyEntry = {
  isShared: false,
  url: '',
  expiresAt: null, // unix seconds (UTC)
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'  (reading)
  isSaving: false, // creating or stopping
};

/** Turn the server answer into the entry fields. A link already past its time counts as no link. */
export function parseShare(data, nowMs = Date.now()) {
  const expiresAt = data && data.expires_at ? Number(data.expires_at) : null;
  const isLive = !!(data && data.shared && data.url && expiresAt && expiresAt * 1000 > nowMs);
  return { isShared: isLive, url: isLive ? data.url : '', expiresAt: isLive ? expiresAt : null };
}

/** Read the vehicle's current link. @param {{ deviceId: number }} request */
export const fetchShare = createAsyncThunk('share/fetch', async ({ deviceId }, { rejectWithValue }) => {
  try {
    return { deviceId, ...parseShare(await shareApi.getShare(deviceId)) };
  } catch (error) {
    return rejectWithValue({ deviceId, message: error.message });
  }
});

/** Make a link valid for `hours` (1 to 12). @param {{ deviceId: number, hours: number }} request */
export const createShareLink = createAsyncThunk('share/create', async ({ deviceId, hours }, { rejectWithValue }) => {
  try {
    const share = parseShare(await shareApi.createShare(deviceId, hours));
    if (!share.isShared) {
      return rejectWithValue({ deviceId, message: 'The server did not return a link' });
    }
    return { deviceId, ...share };
  } catch (error) {
    return rejectWithValue({ deviceId, message: error.message });
  }
});

/** Stop sharing now. @param {{ deviceId: number }} request */
export const stopShare = createAsyncThunk('share/stop', async ({ deviceId }, { rejectWithValue }) => {
  try {
    await shareApi.removeShare(deviceId);
    return { deviceId };
  } catch (error) {
    return rejectWithValue({ deviceId, message: error.message });
  }
});

const shareSlice = createSlice({
  name: 'share',
  initialState: { byDevice: {} },
  reducers: {},
  extraReducers: (builder) => {
    const current = (state, deviceId) => state.byDevice[deviceId] || emptyEntry;
    const markSaving = (state, action) => {
      const { deviceId } = action.meta.arg;
      state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: true };
    };
    const clearSaving = (state, action) => {
      const { deviceId } = action.meta.arg;
      state.byDevice[deviceId] = { ...current(state, deviceId), isSaving: false };
    };
    builder
      .addCase(fetchShare.pending, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'loading' };
      })
      .addCase(fetchShare.fulfilled, (state, action) => {
        const { deviceId, isShared, url, expiresAt } = action.payload;
        state.byDevice[deviceId] = { ...current(state, deviceId), isShared, url, expiresAt, status: 'succeeded' };
      })
      .addCase(fetchShare.rejected, (state, action) => {
        const { deviceId } = action.meta.arg;
        state.byDevice[deviceId] = { ...current(state, deviceId), status: 'failed' };
      })
      .addCase(createShareLink.pending, markSaving)
      .addCase(createShareLink.fulfilled, (state, action) => {
        const { deviceId, isShared, url, expiresAt } = action.payload;
        state.byDevice[deviceId] = { ...current(state, deviceId), isShared, url, expiresAt, status: 'succeeded', isSaving: false };
      })
      .addCase(createShareLink.rejected, clearSaving)
      .addCase(stopShare.pending, markSaving)
      .addCase(stopShare.fulfilled, (state, action) => {
        state.byDevice[action.payload.deviceId] = { ...emptyEntry, status: 'succeeded' };
      })
      .addCase(stopShare.rejected, clearSaving)
      .addCase(logout, () => ({ byDevice: {} }));
  },
});

export default shareSlice.reducer;

// Selectors
export const selectShare = (deviceId) => (state) => state.share.byDevice[deviceId] || emptyEntry;
