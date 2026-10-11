// The vehicle action row and the Share message.
import { VEHICLE_ACTIONS, buildShareMessage } from '../src/utils/vehicleActions';

describe('VEHICLE_ACTIONS', () => {
  const keys = VEHICLE_ACTIONS.map((action) => action.key);

  it('starts with playback and hides driving', () => {
    expect(keys[0]).toBe('playback');
    expect(keys).not.toContain('driving');
  });

  it('has the new actions', () => {
    expect(keys).toEqual(expect.arrayContaining(['routeAnalytics', 'routeFinder', 'alarm', 'share']));
  });

  it('marks the ones that are not built yet', () => {
    const notReady = VEHICLE_ACTIONS.filter((action) => action.isReady === false).map((action) => action.key);
    expect(notReady).toEqual([]);
  });
});

describe('buildShareMessage', () => {
  it('has the name, plate, address and a map link', () => {
    const message = buildShareMessage({
      device_name: 'Bogura NA 11-1516',
      plate_number: 'NA 11',
      address: 'Gobindaganj',
      lat: '25.098876',
      lng: '89.439795',
    });
    expect(message).toContain('Bogura NA 11-1516 (NA 11)');
    expect(message).toContain('Gobindaganj');
    expect(message).toContain('https://maps.google.com/?q=25.098876,89.439795');
  });

  it('returns null when there is no position', () => {
    expect(buildShareMessage({ device_name: 'A', lat: null, lng: null })).toBeNull();
    expect(buildShareMessage({ device_name: 'A', lat: 0, lng: 0 })).toBeNull();
    expect(buildShareMessage(undefined)).toBeNull();
  });
});
