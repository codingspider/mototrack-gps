// Call alerts: power cut and geofence in / out pushes ring like a phone call, each with its own recorded message.
import {
  buildCallScreenText,
  CALL_ALERT_CALLER,
  CALL_ALERT_REASONS,
  getCallAlertMessage,
  getCallAlertReason,
  getCallAlertText,
} from '../src/utils/callAlert';

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

  it('rings when a vehicle enters a geofence', () => {
    expect(getCallAlertReason({ data: { type: 'zone_in', title: 'Bogura Zone in' } })).toBe('geofenceIn');
    expect(getCallAlertReason({ data: { type: 'GEOFENCE_IN' } })).toBe('geofenceIn');
  });

  it('rings for a push the server marked as a call alert', () => {
    expect(getCallAlertReason({ data: { call_alert: '1', title: 'Bogura Left geofence Home' } })).toBe('geofenceOut');
    expect(getCallAlertReason({ data: { call_alert: '1', title: 'Bogura Zone in Home' } })).toBe('geofenceIn');
    expect(getCallAlertReason({ data: { call_alert: '1', title: 'Something new' } })).toBe('powerCut');
  });

  it('does not ring for other alerts', () => {
    expect(getCallAlertReason({ data: { type: 'overspeed', title: 'Bogura Overspeed' } })).toBeNull();
    expect(getCallAlertReason({ notification: { title: 'Bogura NA 11-1516 Ignition off' } })).toBeNull();
    expect(getCallAlertReason(null)).toBeNull();
  });
});

describe('getCallAlertText', () => {
  const title = 'Honda SP160 Zone in (Home)';

  it('shows the vehicle big, with its plate and the alert under it', () => {
    const data = { vehicle_name: 'Honda SP160', plate_number: 'DM GA 32-4468', message: 'Zone in (Home)' };
    expect(getCallAlertText({ title, body: 'Speed: 0 kph' }, data)).toEqual({
      caller: 'Honda SP160',
      detail: 'DM GA 32-4468 · Zone in (Home)',
    });
  });

  it('leaves the plate out when there is none, or it is the name already', () => {
    expect(getCallAlertText({ title, body: '' }, { vehicle_name: 'Honda SP160' }).detail).toBe('Zone in (Home)');
    expect(
      getCallAlertText({ title: 'DM GA 32-4468 Power cut', body: '' }, { vehicle_name: 'DM GA 32-4468', plate_number: 'DM GA 32-4468' }),
    ).toEqual({ caller: 'DM GA 32-4468', detail: 'Power cut' });
  });

  it('reads the vehicle from the title of a push from an older server', () => {
    expect(getCallAlertText({ title: 'Bogura NA 11-1516 Power cut', body: '' }, { message: 'Power cut' })).toEqual({
      caller: 'Bogura NA 11-1516',
      detail: 'Power cut',
    });
  });

  it('keeps MotoTrack as the caller when the vehicle is unknown', () => {
    expect(getCallAlertText({ title: 'Bogura NA 11-1516 Power cut', body: 'Speed: 0 kph' })).toEqual({
      caller: CALL_ALERT_CALLER,
      detail: 'Bogura NA 11-1516 Power cut',
    });
    expect(getCallAlertText({ title: '', body: 'Power cut' }).detail).toBe('Power cut');
  });
});

describe('buildCallScreenText', () => {
  it('builds the test call of a vehicle', () => {
    expect(buildCallScreenText({ vehicleName: 'Honda SP160', plate: 'DM GA 32-4468', alertText: 'Test call' })).toEqual({
      caller: 'Honda SP160',
      detail: 'DM GA 32-4468 · Test call',
    });
  });

  it('falls back to the plate, then to MotoTrack', () => {
    expect(buildCallScreenText({ plate: 'DM GA 32-4468', alertText: 'Test' })).toEqual({ caller: 'DM GA 32-4468', detail: 'Test' });
    expect(buildCallScreenText({ alertText: 'Test' })).toEqual({ caller: CALL_ALERT_CALLER, detail: 'Test' });
  });
});

describe('getCallAlertMessage', () => {
  it('plays its own recorded message for each kind of call', () => {
    expect(getCallAlertMessage('powerCut')).toBe('call_alert_message');
    expect(getCallAlertMessage('geofenceIn')).toBe('geofence_in_alert_message');
    expect(getCallAlertMessage('geofenceOut')).toBe('geofence_out_alert_message');
  });

  it('plays the power cut message for anything unknown', () => {
    expect(getCallAlertMessage('somethingElse')).toBe('call_alert_message');
  });

  it('has a message for every kind', () => {
    CALL_ALERT_REASONS.forEach((reason) => expect(getCallAlertMessage(reason)).toMatch(/^[a-z_]+$/));
  });
});
