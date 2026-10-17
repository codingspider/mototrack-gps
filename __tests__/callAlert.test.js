// Call alerts: power cut and geofence out pushes ring like a phone call.
import { CALL_ALERT_CALLER, getCallAlertReason, getCallAlertText } from '../src/utils/callAlert';

describe('getCallAlertReason', () => {
  it('rings for a power cut, whatever part of the push holds the words', () => {
    expect(getCallAlertReason({ data: { title: 'Bogura NA 11-1516 Power cut', body: 'Speed: 0 kph' } })).toBe(
      'powerCut',
    );
    expect(getCallAlertReason({ notification: { title: 'Bogura NA 11-1516 POWER CUT' } })).toBe('powerCut');
    expect(getCallAlertReason({ data: { message: 'Vehicle Power Disconnected' } })).toBe('powerCut');
  });

  it('rings when a vehicle leaves a geofence', () => {
    expect(getCallAlertReason({ data: { type: 'zone_out', title: 'Bogura LA 15-4717 Zone out' } })).toBe('geofenceOut');
    expect(getCallAlertReason({ data: { type: 'geofence_out' } })).toBe('geofenceOut');
  });

  it('rings for a push the server marked as a call alert', () => {
    expect(getCallAlertReason({ data: { call_alert: '1', title: 'Bogura Left geofence Home' } })).toBe('geofenceOut');
    expect(getCallAlertReason({ data: { call_alert: '1', title: 'Something new' } })).toBe('powerCut');
  });

  it('does not ring for other alerts', () => {
    expect(getCallAlertReason({ data: { type: 'zone_in', title: 'Bogura Zone in' } })).toBeNull();
    expect(getCallAlertReason({ data: { type: 'overspeed', title: 'Bogura Overspeed' } })).toBeNull();
    expect(getCallAlertReason({ notification: { title: 'Bogura NA 11-1516 Ignition off' } })).toBeNull();
    expect(getCallAlertReason(null)).toBeNull();
  });
});

describe('getCallAlertText', () => {
  it('shows MotoTrack as the caller and the alert title under it', () => {
    expect(getCallAlertText({ title: 'Bogura NA 11-1516 Power cut', body: 'Speed: 0 kph' })).toEqual({
      caller: CALL_ALERT_CALLER,
      detail: 'Bogura NA 11-1516 Power cut',
    });
  });

  it('falls back to the body when there is no title', () => {
    expect(getCallAlertText({ title: '', body: 'Power cut' }).detail).toBe('Power cut');
  });
});
