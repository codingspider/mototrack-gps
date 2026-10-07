// The toast (small message at the top) that is on screen now. Anything can dispatch showToast.
import { createSlice } from '@reduxjs/toolkit';

export const TOAST_TYPES = ['success', 'info', 'warning', 'error'];

let nextToastId = 1;

const initialState = {
  current: null, // { id, type: 'success'|'info'|'warning'|'error', message }
};

const toastSlice = createSlice({
  name: 'toast',
  initialState,
  reducers: {
    showToast: {
      // A new id makes the toast show again even if the message is the same as before.
      prepare: ({ type = 'info', message }) => ({
        payload: { id: nextToastId++, type: TOAST_TYPES.includes(type) ? type : 'info', message },
      }),
      reducer(state, action) {
        state.current = action.payload;
      },
    },
    dismissToast(state) {
      state.current = null;
    },
  },
});

export const { showToast, dismissToast } = toastSlice.actions;
export default toastSlice.reducer;

// Selectors
export const selectToast = (state) => state.toast.current;
