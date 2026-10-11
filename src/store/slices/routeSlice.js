// The route on screen (Route finder / Route analytics) and the place search that goes with it.
// Google answers, nothing here touches our own server. The newest request always wins.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as directionsApi from '../../api/directionsApi';
import { parseDirections, toDirectionsPlace } from '../../utils/directions';
import { logout } from '../actions';

const initialState = {
  routes: [], // every route Google found, the quickest first
  selectedIndex: 0,
  status: 'idle', // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  latestRouteRequestId: null,
  places: { items: [], status: 'idle', error: null, latestRequestId: null },
};

/**
 * @param {{ origin: object, destination: object }} request Places: { latitude, longitude, placeId?, label? }
 */
export const findRoute = createAsyncThunk('route/findRoute', async ({ origin, destination }, { rejectWithValue }) => {
  try {
    const data = await directionsApi.getDirections(toDirectionsPlace(origin), toDirectionsPlace(destination));
    const routes = parseDirections(data);
    if (routes.length === 0) {
      return rejectWithValue('No route was found between these places');
    }
    return routes;
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

/** @param {{ text: string, near: { latitude: number, longitude: number }|null }} request */
export const searchPlaces = createAsyncThunk('route/searchPlaces', async ({ text, near }, { rejectWithValue }) => {
  try {
    return await directionsApi.searchPlaces(text, near);
  } catch (error) {
    return rejectWithValue(error.message);
  }
});

const routeSlice = createSlice({
  name: 'route',
  initialState,
  reducers: {
    selectRoute(state, action) {
      state.selectedIndex = action.payload;
    },
    clearRoute(state) {
      state.routes = [];
      state.selectedIndex = 0;
      state.status = 'idle';
      state.error = null;
      state.latestRouteRequestId = null;
    },
    clearPlaces(state) {
      state.places = { items: [], status: 'idle', error: null, latestRequestId: null };
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(findRoute.pending, (state, action) => {
        state.status = 'loading';
        state.error = null;
        state.latestRouteRequestId = action.meta.requestId;
      })
      .addCase(findRoute.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.latestRouteRequestId) {
          return; // a newer search replaced this one
        }
        state.routes = action.payload;
        state.selectedIndex = 0;
        state.status = 'succeeded';
      })
      .addCase(findRoute.rejected, (state, action) => {
        if (action.meta.requestId !== state.latestRouteRequestId) {
          return;
        }
        state.routes = [];
        state.status = 'failed';
        state.error = action.payload || 'Could not get the route';
      })
      .addCase(searchPlaces.pending, (state, action) => {
        state.places.status = 'loading';
        state.places.latestRequestId = action.meta.requestId;
      })
      .addCase(searchPlaces.fulfilled, (state, action) => {
        if (action.meta.requestId !== state.places.latestRequestId) {
          return;
        }
        state.places = { ...state.places, items: action.payload, status: 'succeeded', error: null };
      })
      .addCase(searchPlaces.rejected, (state, action) => {
        if (action.meta.requestId !== state.places.latestRequestId) {
          return;
        }
        state.places = { ...state.places, items: [], status: 'failed', error: action.payload || 'Could not search' };
      })
      .addCase(logout, () => initialState);
  },
});

export const { selectRoute, clearRoute, clearPlaces } = routeSlice.actions;
export default routeSlice.reducer;

// Selectors
export const selectRouteState = (state) => state.route;
export const selectSelectedRoute = (state) => state.route.routes[state.route.selectedIndex] || null;
