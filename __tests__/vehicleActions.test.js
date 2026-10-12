// The vehicle action row and the Share link message.
import { SHARE_HOURS, VEHICLE_ACTIONS, buildShareLinkMessage } from '../src/utils/vehicleActions';

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

describe('buildShareLinkMessage', () => {
  it('has the name, plate, the expiry in Bangladesh time and the link', () => {
    // 1790493116 s = 27 Sep 2026, 07:11 AM UTC = 01:11 PM Bangladesh
    const message = buildShareLinkMessage(
      { device_name: 'Bogura NA 11-1516', plate_number: 'NA 11' },
      'https://mototrack24.com/sharing/abc',
      1790493116,
    );
    expect(message).toContain('Bogura NA 11-1516 (NA 11)');
    expect(message).toContain('27 Sep 2026, 01:11 PM');
    expect(message).toContain('https://mototrack24.com/sharing/abc');
  });

  it('leaves out the plate when there is none', () => {
    const message = buildShareLinkMessage({ device_name: 'A' }, 'https://x', 1790493116);
    expect(message.split('\n')[0]).toBe('Track A live');
  });
});

describe('SHARE_HOURS', () => {
  it('offers 1 to 12 hours', () => {
    expect(SHARE_HOURS[0]).toBe(1);
    expect(SHARE_HOURS[SHARE_HOURS.length - 1]).toBe(12);
  });
});
