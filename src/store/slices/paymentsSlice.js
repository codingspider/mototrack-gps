// Renewal payments: the plans, each vehicle's expiry date, and the one payment in progress.
// The server decides prices, success and the new expiry date; this slice only carries them to the screens.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as dgepayApi from '../../api/dgepayApi';
import * as paymentsApi from '../../api/paymentsApi';
import { logout } from '../actions';
import { fetchVehicleDetails, fetchVehicles } from './vehiclesSlice';
import { getCartTotal } from '../../utils/payments';

const PLANS_STALE_AFTER_MS = 5 * 60 * 1000; // plans change rarely
const EXPIRY_STALE_AFTER_MS = 60 * 1000;

const emptyCheckout = {
  status: 'idle', // 'idle' | 'starting' | 'paying' | 'confirming' | 'succeeded' | 'failed'
  transactionId: null,
  paymentUrl: null,
  deviceIds: [],
  planId: null,
  planTitle: null,
  quantity: 1,
  amount: 0,
  error: null,
  result: null, // the server's answer once the payment is confirmed
};

const initialState = {
  plans: { items: [], status: 'idle', error: null, lastFetchedAt: null },
  expiry: { byId: {}, status: 'idle', error: null, lastFetchedAt: null }, // byId: { 4: '2026-11-01' | null }
  checkout: emptyCheckout,
};

/** Build the "fetch only when missing or stale" rule for one part of this slice. */
function makeCondition(part, staleAfterMs) {
  return (options = {}, { getState }) => {
    const { status, lastFetchedAt } = getState().payments[part];
    if (status === 'loading') {
      return false;
    }
    if (options.force) {
      return true;
    }
    return !(lastFetchedAt && Date.now() - lastFetchedAt < staleAfterMs);
  };
}

export const fetchPlans = createAsyncThunk(
  'payments/fetchPlans',
  async (_, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.getDevicePlans();
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { condition: makeCondition('plans', PLANS_STALE_AFTER_MS) },
);

export const fetchExpiry = createAsyncThunk(
  'payments/fetchExpiry',
  async (_, { rejectWithValue }) => {
    try {
      const data = await paymentsApi.getPayableVehicles();
      const byId = {};
      (data.items || []).forEach((item) => {
        byId[item.device_id] = item.expiration_date || null;
      });
      return byId;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  { condition: makeCondition('expiry', EXPIRY_STALE_AFTER_MS) },
);

/**
 * Start the DGePay payment for the cart. On success the payment screen opens `checkout.paymentUrl`.
 * @param {{ deviceIds: number[], plan: object, quantity: number }} cart
 */
export const startCheckout = createAsyncThunk(
  'payments/startCheckout',
  async ({ deviceIds, plan, quantity }, { rejectWithValue }) => {
    try {
      const amount = getCartTotal(plan.price, quantity, deviceIds.length);
      if (amount <= 0) {
        throw new Error('This plan has no price, please choose another plan');
      }
      const note = plan.title || 'Renewal';
      const { transactionId, paymentUrl } = await dgepayApi.startDgepayPayment({ amount, note });
      return { transactionId, paymentUrl, deviceIds, planId: plan.id, planTitle: plan.title, quantity, amount };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/**
 * After the DGePay page returned: ask the server to verify the payment and renew the vehicles, then read the new
 * expiry dates back. Never marks anything paid by itself.
 */
export const confirmCheckout = createAsyncThunk('payments/confirmCheckout', async (_, { getState, dispatch, rejectWithValue }) => {
  const { transactionId, deviceIds, planId, amount } = getState().payments.checkout;
  try {
    const data = await paymentsApi.confirmPayment({ deviceIds, planId, amount, transactionId });
    if (data.status !== 1) {
      throw new Error(data.message || 'The payment was not completed');
    }
    await Promise.all([
      dispatch(fetchExpiry({ force: true })),
      dispatch(fetchVehicles({ force: true })),
      ...deviceIds.map((id) => dispatch(fetchVehicleDetails({ id, force: true }))),
    ]);
    return data;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const paymentsSlice = createSlice({
  name: 'payments',
  initialState,
  reducers: {
    // Forget the payment in progress (the lists stay)
    checkoutCleared(state) {
      state.checkout = emptyCheckout;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchPlans.pending, (state) => {
        state.plans.status = 'loading';
        state.plans.error = null;
      })
      .addCase(fetchPlans.fulfilled, (state, action) => {
        state.plans = { items: action.payload, status: 'succeeded', error: null, lastFetchedAt: Date.now() };
      })
      .addCase(fetchPlans.rejected, (state, action) => {
        state.plans.status = 'failed';
        state.plans.error = action.payload || 'Could not load the plans';
      })
      .addCase(fetchExpiry.pending, (state) => {
        state.expiry.status = 'loading';
        state.expiry.error = null;
      })
      .addCase(fetchExpiry.fulfilled, (state, action) => {
        state.expiry = { byId: action.payload, status: 'succeeded', error: null, lastFetchedAt: Date.now() };
      })
      .addCase(fetchExpiry.rejected, (state, action) => {
        state.expiry.status = 'failed';
        state.expiry.error = action.payload || 'Could not load the expiry dates';
      })
      .addCase(startCheckout.pending, (state) => {
        state.checkout = { ...emptyCheckout, status: 'starting' };
      })
      .addCase(startCheckout.fulfilled, (state, action) => {
        state.checkout = { ...emptyCheckout, ...action.payload, status: 'paying' };
      })
      .addCase(startCheckout.rejected, (state, action) => {
        state.checkout = { ...emptyCheckout, status: 'failed', error: action.payload || 'The payment could not be started' };
      })
      .addCase(confirmCheckout.pending, (state) => {
        state.checkout.status = 'confirming';
        state.checkout.error = null;
      })
      .addCase(confirmCheckout.fulfilled, (state, action) => {
        state.checkout.status = 'succeeded';
        state.checkout.result = action.payload.data || null;
      })
      .addCase(confirmCheckout.rejected, (state, action) => {
        state.checkout.status = 'failed';
        state.checkout.error = action.payload || 'The payment could not be confirmed';
      })
      .addCase(logout, () => initialState);
  },
});

export const { checkoutCleared } = paymentsSlice.actions;
export default paymentsSlice.reducer;

// Selectors
export const selectPlans = (state) => state.payments.plans;
export const selectExpiry = (state) => state.payments.expiry;
export const selectCheckout = (state) => state.payments.checkout;
