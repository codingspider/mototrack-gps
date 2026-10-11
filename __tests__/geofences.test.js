// Geofences: reading the server's shapes, building the request bodies, and the save / delete steps.
import { configureStore } from '@reduxjs/toolkit';
import * as geofencesApi from '../src/api/geofencesApi';
import geofencesReducer, {
  deleteVehicleGeofence,
  fetchGeofences,
  fetchVehicleGeofences,
  saveVehicleGeofence,
} from '../src/store/slices/geofencesSlice';
import {
  buildEditPayload,
  buildGeofencePayload,
  getCenter,
  getCircle,
  getZoneText,
  joinVehicleGeofences,
  parseCoordinates,
} from '../src/utils/geofence';

jest.mock('../src/api/geofencesApi');

const points = [
  { latitude: 24.1, longitude: 89.1 },
  { latitude: 24.2, longitude: 89.1 },
  { latitude: 24.2, longitude: 89.2 },
];

describe('geofence helpers', () => {
  it('reads the polygon from the server JSON text or a list', () => {
    const text = '[{"lat":24.1,"lng":89.1},{"lat":"24.2","lng":"89.2"}]';
    expect(parseCoordinates(text)).toEqual([
      { latitude: 24.1, longitude: 89.1 },
      { latitude: 24.2, longitude: 89.2 },
    ]);
    expect(parseCoordinates([{ lat: 1, lng: 2 }])).toEqual([{ latitude: 1, longitude: 2 }]);
    expect(parseCoordinates('not json')).toEqual([]);
    expect(parseCoordinates(null)).toEqual([]);
  });

  it('reads a circle', () => {
    expect(getCircle({ type: 'circle', center: { lat: 24.1, lng: 89.1 }, radius: 150 })).toEqual({
      latitude: 24.1,
      longitude: 89.1,
      radius: 150,
    });
    expect(getCircle({ type: 'polygon' })).toBeNull();
    expect(getCircle({ type: 'circle', center: null, radius: 10 })).toBeNull();
  });

  it('finds the middle of the points', () => {
    expect(getCenter(points)).toEqual({ latitude: (24.1 + 24.2 + 24.2) / 3, longitude: (89.1 + 89.1 + 89.2) / 3 });
    expect(getCenter([])).toBeNull();
  });

  it('builds the create and edit bodies', () => {
    expect(buildGeofencePayload('  Depot ', points, '#d000df')).toEqual({
      name: 'Depot',
      type: 'polygon',
      polygon_color: '#d000df',
      polygon: [
        { lat: 24.1, lng: 89.1 },
        { lat: 24.2, lng: 89.1 },
        { lat: 24.2, lng: 89.2 },
      ],
    });
    expect(buildEditPayload(9, 'Yard', null, '#2563eb')).toEqual({ id: 9, name: 'Yard', polygon_color: '#2563eb' });
    expect(buildEditPayload(9, 'Yard', points, '#2563eb')).toMatchObject({ id: 9, type: 'polygon' });
  });

  it('joins the vehicle links with the geofences', () => {
    const links = [
      { alert_id: 1, zone: 'out', active: true, geofence_id: 9, geofence_name: 'Old name', type: 'polygon', polygon_color: '#111111' },
      { alert_id: 2, zone: 'in', active: false, geofence_id: 10, geofence_name: 'Only link', type: 'circle', polygon_color: '#222222' },
    ];
    const rows = joinVehicleGeofences(links, { 9: { id: 9, name: 'Depot', type: 'polygon', polygon_color: '#d000df' } });
    expect(rows[0]).toMatchObject({ id: 9, name: 'Depot', color: '#d000df', zone: 'out', isActive: true });
    expect(rows[1]).toMatchObject({ id: 10, name: 'Only link', type: 'circle', isActive: false, geofence: null });
  });

  it('words the alert zone', () => {
    expect(getZoneText('out')).toContain('leaves');
    expect(getZoneText('both')).toContain('enters or leaves');
  });
});

describe('geofencesSlice', () => {
  const makeStore = () => configureStore({ reducer: { geofences: geofencesReducer } });

  beforeEach(() => {
    Object.values(geofencesApi).forEach((fn) => fn.mockReset && fn.mockReset());
    geofencesApi.getGeofences.mockResolvedValue({ items: { geofences: [] } });
    geofencesApi.getVehicleGeofences.mockResolvedValue({ items: [] });
  });

  it('keeps the geofences by id, from the nested or plain list', async () => {
    geofencesApi.getGeofences.mockResolvedValueOnce({ items: { geofences: [{ id: 9, name: 'Depot' }] } });
    const store = makeStore();
    await store.dispatch(fetchGeofences());
    expect(store.getState().geofences.zones.byId[9].name).toBe('Depot');
    geofencesApi.getGeofences.mockResolvedValueOnce({ items: [{ id: 10, name: 'Yard' }] });
    await store.dispatch(fetchGeofences({ force: true }));
    expect(Object.keys(store.getState().geofences.zones.byId)).toEqual(['10']);
  });

  it('keeps links per vehicle and does not refetch fresh ones', async () => {
    geofencesApi.getVehicleGeofences.mockResolvedValue({ items: [{ geofence_id: 9, zone: 'out' }] });
    const store = makeStore();
    await store.dispatch(fetchVehicleGeofences({ deviceId: 5 }));
    await store.dispatch(fetchVehicleGeofences({ deviceId: 5 }));
    expect(geofencesApi.getVehicleGeofences).toHaveBeenCalledTimes(1);
    expect(store.getState().geofences.linksByDevice[5].items).toHaveLength(1);
  });

  it('creates a geofence then links it to the vehicle', async () => {
    geofencesApi.addGeofence.mockResolvedValue({ status: 1, item: { id: 77 } });
    geofencesApi.linkVehicleGeofence.mockResolvedValue({ status: 1 });
    const store = makeStore();
    const result = await store.dispatch(
      saveVehicleGeofence({ deviceId: 5, geofenceId: null, name: 'Depot', color: '#d000df', points, zone: 'out' }),
    );
    expect(saveVehicleGeofence.fulfilled.match(result)).toBe(true);
    expect(geofencesApi.linkVehicleGeofence).toHaveBeenCalledWith({ deviceId: 5, geofenceId: 77, zone: 'out' });
    expect(geofencesApi.getGeofences).toHaveBeenCalled(); // read back
  });

  it('edits an existing geofence without sending a shape for a circle', async () => {
    geofencesApi.editGeofence.mockResolvedValue({ status: 1 });
    geofencesApi.linkVehicleGeofence.mockResolvedValue({ status: 1 });
    const store = makeStore();
    await store.dispatch(
      saveVehicleGeofence({ deviceId: 5, geofenceId: 9, name: 'Ring', color: '#2563eb', points: null, zone: 'both' }),
    );
    expect(geofencesApi.editGeofence).toHaveBeenCalledWith({ id: 9, name: 'Ring', polygon_color: '#2563eb' });
    expect(geofencesApi.addGeofence).not.toHaveBeenCalled();
  });

  it('says so when the geofence was saved but the alert link failed', async () => {
    geofencesApi.addGeofence.mockResolvedValue({ status: 1, item: { id: 77 } });
    geofencesApi.linkVehicleGeofence.mockRejectedValue(new Error('No permission'));
    const store = makeStore();
    const result = await store.dispatch(
      saveVehicleGeofence({ deviceId: 5, geofenceId: null, name: 'Depot', color: '#d000df', points, zone: 'out' }),
    );
    expect(result.payload).toContain('saved, but the alert could not be set');
  });

  it('rejects when the server returns no geofence id', async () => {
    geofencesApi.addGeofence.mockResolvedValue({ status: 0, message: 'Name taken' });
    const store = makeStore();
    const result = await store.dispatch(
      saveVehicleGeofence({ deviceId: 5, geofenceId: null, name: 'Depot', color: '#d000df', points, zone: 'out' }),
    );
    expect(result.payload).toBe('Name taken');
    expect(geofencesApi.linkVehicleGeofence).not.toHaveBeenCalled();
  });

  it('unlinks then deletes, and still deletes when the link is already gone', async () => {
    geofencesApi.unlinkVehicleGeofence.mockRejectedValue(new Error('This geofence is not linked'));
    geofencesApi.destroyGeofence.mockResolvedValue({ status: 1 });
    const store = makeStore();
    const result = await store.dispatch(deleteVehicleGeofence({ deviceId: 5, geofenceId: 9 }));
    expect(deleteVehicleGeofence.fulfilled.match(result)).toBe(true);
    expect(geofencesApi.destroyGeofence).toHaveBeenCalledWith(9);
    expect(store.getState().geofences.isDeleting).toBe(false);
  });

  it('keeps the error when the delete fails', async () => {
    geofencesApi.unlinkVehicleGeofence.mockResolvedValue({ status: 1 });
    geofencesApi.destroyGeofence.mockRejectedValue(new Error('You cannot delete this'));
    const store = makeStore();
    const result = await store.dispatch(deleteVehicleGeofence({ deviceId: 5, geofenceId: 9 }));
    expect(result.payload).toBe('You cannot delete this');
  });
});
