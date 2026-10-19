// The details page keeps the status live with a silent refresh: it must not look like loading (no refresh car).
import { configureStore } from '@reduxjs/toolkit';
import * as vehiclesApi from '../src/api/vehiclesApi';
import vehiclesReducer, { fetchVehicles } from '../src/store/slices/vehiclesSlice';

jest.mock('../src/api/vehiclesApi');

const makeStore = () => configureStore({ reducer: { vehicles: vehiclesReducer } });

describe('silent vehicle refresh', () => {
  it('never puts the list in the loading state', async () => {
    vehiclesApi.getVehicles.mockResolvedValue({ items: [{ id: 1, status: 'Moving' }] });
    const store = makeStore();
    await store.dispatch(fetchVehicles());
    const statuses = [];
    const unsubscribe = store.subscribe(() => statuses.push(store.getState().vehicles.status));
    await store.dispatch(fetchVehicles({ force: true, silent: true }));
    unsubscribe();
    expect(statuses).not.toContain('loading');
    expect(store.getState().vehicles.status).toBe('succeeded');
  });

  it('keeps the list as it was when a silent refresh fails', async () => {
    vehiclesApi.getVehicles.mockResolvedValueOnce({ items: [{ id: 1, status: 'Moving' }] });
    const store = makeStore();
    await store.dispatch(fetchVehicles());
    vehiclesApi.getVehicles.mockRejectedValueOnce(new Error('No internet'));
    await store.dispatch(fetchVehicles({ force: true, silent: true }));
    expect(store.getState().vehicles.status).toBe('succeeded');
    expect(store.getState().vehicles.error).toBeNull();
  });

  it('still shows loading for a normal refresh', async () => {
    vehiclesApi.getVehicles.mockResolvedValue({ items: [] });
    const store = makeStore();
    const statuses = [];
    store.subscribe(() => statuses.push(store.getState().vehicles.status));
    await store.dispatch(fetchVehicles({ force: true }));
    expect(statuses).toContain('loading');
  });
});
