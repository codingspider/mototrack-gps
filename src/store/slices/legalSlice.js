// The legal pages (terms, privacy) the server gives us, so the app opens the address the portal says.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as accountApi from '../../api/accountApi';

const initialState = {
  items: [], // [{ slug, title, url }]
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
};

/** Load the list once; skipped when it is loaded or loading. */
export const fetchLegalPages = createAsyncThunk(
  'legal/fetch',
  async (_, { rejectWithValue }) => {
    try {
      const data = await accountApi.getLegalPages();
      return data.items || [];
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    condition: (_, { getState }) => {
      const { status } = getState().legal;
      return status === 'idle' || status === 'failed';
    },
  },
);

const legalSlice = createSlice({
  name: 'legal',
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchLegalPages.pending, (state) => {
        state.status = 'loading';
      })
      .addCase(fetchLegalPages.fulfilled, (state, action) => {
        state.items = action.payload;
        state.status = 'succeeded';
      })
      .addCase(fetchLegalPages.rejected, (state) => {
        state.status = 'failed';
      });
  },
});

export default legalSlice.reducer;

// Selectors
export const selectLegalPage = (slug) => (state) => state.legal.items.find((item) => item.slug === slug) || null;
export const selectLegalStatus = (state) => state.legal.status;
