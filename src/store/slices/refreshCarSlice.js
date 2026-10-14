// How many pages are refreshing right now, so one floating running-car animation can show while any of them is.
// `placement` says which header the car sits under: 'stack' (the normal screen header) or 'home' (the taller Home header).
import { createSlice } from '@reduxjs/toolkit';

const refreshCarSlice = createSlice({
  name: 'refreshCar',
  initialState: { count: 0, placement: 'stack' },
  reducers: {
    refreshStarted(state, action) {
      state.count += 1;
      state.placement = action.payload || 'stack';
    },
    refreshEnded(state) {
      state.count = Math.max(0, state.count - 1);
    },
  },
});

export const { refreshStarted, refreshEnded } = refreshCarSlice.actions;
export default refreshCarSlice.reducer;

// Selectors
export const selectIsRefreshing = (state) => state.refreshCar.count > 0;
export const selectRefreshPlacement = (state) => state.refreshCar.placement;
