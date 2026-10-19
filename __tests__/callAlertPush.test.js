// ringIfCallAlert: each kind of call alert has its own switch and plays its own recorded message.
jest.mock('../src/utils/callAlertStorage', () => ({ loadCallAlertEnabled: jest.fn() }));
jest.mock('../src/utils/appNotification', () => ({ showCallAlert: jest.fn() }));

const { loadCallAlertEnabled } = require('../src/utils/callAlertStorage');
const { showCallAlert } = require('../src/utils/appNotification');
const { ringIfCallAlert } = require('../src/utils/callAlertPush');

const text = { title: 'Bogura NA 11-1516 Zone in', body: 'Speed: 0 kph' };

describe('ringIfCallAlert', () => {
  beforeEach(() => {
    loadCallAlertEnabled.mockReset();
    showCallAlert.mockReset();
  });

  it('rings a geofence entry with the enter message, checking the enter switch', async () => {
    loadCallAlertEnabled.mockResolvedValue(true);
    expect(await ringIfCallAlert({ data: { type: 'zone_in' } }, text)).toBe(true);
    expect(loadCallAlertEnabled).toHaveBeenCalledWith('geofenceIn');
    expect(showCallAlert).toHaveBeenCalledWith('MotoTrack Alert', 'Bogura NA 11-1516 Zone in', 'geofence_in_alert_message');
  });

  it('shows the vehicle the server names on the call screen', async () => {
    loadCallAlertEnabled.mockResolvedValue(true);
    const data = { type: 'zone_in', vehicle_name: 'Bogura NA 11-1516', plate_number: 'DM GA 11-1516', message: 'Zone in' };
    await ringIfCallAlert({ data }, text);
    expect(showCallAlert).toHaveBeenCalledWith('Bogura NA 11-1516', 'DM GA 11-1516 · Zone in', 'geofence_in_alert_message');
  });

  it('rings a geofence exit with the leave message', async () => {
    loadCallAlertEnabled.mockResolvedValue(true);
    await ringIfCallAlert({ data: { type: 'zone_out' } }, { title: 'Bogura Zone out', body: '' });
    expect(loadCallAlertEnabled).toHaveBeenCalledWith('geofenceOut');
    expect(showCallAlert.mock.calls[0][2]).toBe('geofence_out_alert_message');
  });

  it('rings a power cut with the power cut message', async () => {
    loadCallAlertEnabled.mockResolvedValue(true);
    await ringIfCallAlert({ data: { title: 'Bogura Power cut' } }, { title: 'Bogura Power cut', body: '' });
    expect(loadCallAlertEnabled).toHaveBeenCalledWith('powerCut');
    expect(showCallAlert.mock.calls[0][2]).toBe('call_alert_message');
  });

  it('stays quiet when that kind is switched off', async () => {
    loadCallAlertEnabled.mockResolvedValue(false);
    expect(await ringIfCallAlert({ data: { type: 'zone_in' } }, text)).toBe(false);
    expect(showCallAlert).not.toHaveBeenCalled();
  });

  it('does nothing for other alerts', async () => {
    expect(await ringIfCallAlert({ data: { type: 'overspeed' } }, { title: 'Overspeed', body: '' })).toBe(false);
    expect(await ringIfCallAlert({ data: { type: 'zone_in' } }, null)).toBe(false);
    expect(loadCallAlertEnabled).not.toHaveBeenCalled();
  });
});
