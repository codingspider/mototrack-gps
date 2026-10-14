import { getPushText } from '../src/utils/appNotification';

describe('getPushText', () => {
  it('reads the title and body of a notification push', () => {
    expect(getPushText({ notification: { title: 'Overspeed', body: 'Bogura NA 11-1516: 80 kph' } })).toEqual({
      title: 'Overspeed',
      body: 'Bogura NA 11-1516: 80 kph',
    });
  });

  it('reads a data-only push (title and body, or message, in data)', () => {
    expect(getPushText({ data: { title: 'Ignition off', body: 'Bogura LA 15-4717' } })).toEqual({
      title: 'Ignition off',
      body: 'Bogura LA 15-4717',
    });
    expect(getPushText({ data: { message: 'Geofence left' } })).toEqual({ title: '', body: 'Geofence left' });
  });

  it('prefers the notification part over data', () => {
    const message = { notification: { title: 'A', body: 'B' }, data: { title: 'C', body: 'D' } };
    expect(getPushText(message)).toEqual({ title: 'A', body: 'B' });
  });

  it('gives null when there is nothing to show', () => {
    expect(getPushText({})).toBeNull();
    expect(getPushText({ data: { device_id: '4' } })).toBeNull();
    expect(getPushText(null)).toBeNull();
  });
});
