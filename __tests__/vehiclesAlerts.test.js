// Vehicle list filtering, map coordinates, alert formatting and the alerts slice paging.
import { configureStore } from '@reduxjs/toolkit';
import notificationsReducer, {
  fetchMoreNotifications,
  fetchNotifications,
} from '../src/store/slices/notificationsSlice';
import * as notificationsApi from '../src/api/notificationsApi';
import { formatAlertTime, getAlertStyle, getAlertTitle } from '../src/utils/notifications';
import { countByFilter, filterVehicles, getVehicleCoordinate } from '../src/utils/vehicleFilter';

jest.mock('../src/api/notificationsApi');

const vehicles = [
  { id: 1, device_name: 'Bogura LA 15-4717', plate_number: 'LA 15', status: 'Moving' },
  { id: 2, device_name: 'Dhaka Metro', plate_number: 'DM 11', status: 'Idling' },
  { id: 3, device_name: 'Rangpur', plate_number: null, status: 'Offline' },
  { id: 4, device_name: 'Old', plate_number: 'OLD 1', status: 'Suspended' },
];

describe('filterVehicles', () => {
  it('filters by status group', () => {
    expect(filterVehicles(vehicles, 'moving').map((v) => v.id)).toEqual([1]);
    expect(filterVehicles(vehicles, 'idle').map((v) => v.id)).toEqual([2]);
    expect(filterVehicles(vehicles, 'suspended').map((v) => v.id)).toEqual([4]);
    expect(filterVehicles(vehicles, 'all')).toHaveLength(4);
    expect(filterVehicles(vehicles, 'online').map((v) => v.id)).toEqual([1, 2, 4]); // everything not offline
  });

  it('searches the name and the plate, ignoring case', () => {
    expect(filterVehicles(vehicles, 'all', 'dhaka').map((v) => v.id)).toEqual([2]);
    expect(filterVehicles(vehicles, 'all', 'la 15').map((v) => v.id)).toEqual([1]);
    expect(filterVehicles(vehicles, 'moving', 'dhaka')).toEqual([]);
  });

  it('counts every filter', () => {
    expect(countByFilter(vehicles)).toEqual({ all: 4, online: 3, moving: 1, idle: 1, offline: 1, suspended: 1 });
  });
});

describe('getVehicleCoordinate', () => {
  it('reads numbers and numeric text', () => {
    expect(getVehicleCoordinate({ lat: '25.09', lng: 89.43 })).toEqual({ latitude: 25.09, longitude: 89.43 });
  });

  it('returns null when there is no real position', () => {
    expect(getVehicleCoordinate({ lat: null, lng: null })).toBeNull();
    expect(getVehicleCoordinate({ lat: '', lng: '' })).toBeNull();
    expect(getVehicleCoordinate({ lat: 0, lng: 0 })).toBeNull();
    expect(getVehicleCoordinate({})).toBeNull();
  });
});

describe('alert formatting', () => {
  it('rewrites the server time without converting it', () => {
    expect(formatAlertTime('2026-10-08 12:22:46')).toBe('08 Oct, 12:22 PM');
    expect(formatAlertTime(null)).toBe('-');
  });

  it('picks an icon and falls back to a bell', () => {
    expect(getAlertStyle('overspeed')).toMatchObject({ icon: 'speedometer', tone: 'danger' });
    expect(getAlertStyle('something_new').icon).toBe('bell-outline');
  });

  it('titles an alert from its title, message or type', () => {
    expect(getAlertTitle({ title: 'Overspeed', message: 'x' })).toBe('Overspeed');
    expect(getAlertTitle({ message: 'Entered zone' })).toBe('Entered zone');
    expect(getAlertTitle({ type: 'ignition_on' })).toBe('Ignition on');
  });
});

describe('notificationsSlice', () => {
  const makeStore = () => configureStore({ reducer: { notifications: notificationsReducer } });
  const page = (ids, current, last) => ({
    items: ids.map((id) => ({ id })),
    pagination: { current_page: current, last_page: last, total: 4 },
  });

  it('loads the first page, then adds the next without repeating an alert', async () => {
    notificationsApi.getNotifications
      .mockResolvedValueOnce(page([4, 3], 1, 2))
      .mockResolvedValueOnce(page([3, 2], 2, 2)); // 3 was already shown (a new alert shifted the pages)
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    expect(store.getState().notifications.items.map((i) => i.id)).toEqual([4, 3]);
    await store.dispatch(fetchMoreNotifications());
    const state = store.getState().notifications;
    expect(state.items.map((i) => i.id)).toEqual([4, 3, 2]);
    expect(state.currentPage).toBe(2);
    expect(notificationsApi.getNotifications).toHaveBeenLastCalledWith({ page: 2, perPage: 20 });
  });

  it('does not ask for more after the last page', async () => {
    notificationsApi.getNotifications.mockReset();
    notificationsApi.getNotifications.mockResolvedValueOnce(page([1], 1, 1));
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    await store.dispatch(fetchMoreNotifications());
    expect(notificationsApi.getNotifications).toHaveBeenCalledTimes(1);
  });

  it('keeps an error message when the first page fails', async () => {
    notificationsApi.getNotifications.mockReset();
    notificationsApi.getNotifications.mockRejectedValueOnce(new Error('No internet connection'));
    const store = makeStore();
    await store.dispatch(fetchNotifications());
    expect(store.getState().notifications).toMatchObject({ status: 'failed', error: 'No internet connection' });
  });
});
