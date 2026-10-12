// parseAlerts turns the /get_alerts answer into simple rows.
import { parseAlerts } from '../src/store/slices/alarmSettingsSlice';

describe('parseAlerts', () => {
  it('reads items.alerts', () => {
    const rows = parseAlerts({ status: 1, items: { alerts: [{ id: 3, name: 'Overspeed', active: 1, devices: [1, 2] }] } });
    expect(rows).toEqual([{ id: 3, name: 'Overspeed', active: true, deviceCount: 2 }]);
  });

  it('reads items as an array and handles active 0 / "0"', () => {
    const rows = parseAlerts({ items: [{ id: 1, active: 0 }, { id: 2, name: 'Geofence', active: '0' }] });
    expect(rows.map((row) => row.active)).toEqual([false, false]);
    expect(rows[0].name).toBe('Alarm 1');
  });

  it('returns an empty list for an empty answer', () => {
    expect(parseAlerts(null)).toEqual([]);
  });
});
