import {
  getStatusAfterPosition,
  getStatusGroup,
  STATUS_ENGINE_OFF,
  STATUS_IDLING,
  STATUS_MOVING,
  STATUS_OFFLINE,
  STATUS_SUSPENDED,
} from '../src/utils/vehicleStatus';

describe('getStatusGroup', () => {
  it('groups server labels', () => {
    expect(getStatusGroup(STATUS_MOVING)).toBe('moving');
    expect(getStatusGroup(STATUS_IDLING)).toBe('idle');
    expect(getStatusGroup(STATUS_ENGINE_OFF)).toBe('idle');
    expect(getStatusGroup(STATUS_SUSPENDED)).toBe('suspended');
    expect(getStatusGroup(STATUS_OFFLINE)).toBe('offline');
  });
});

describe('getStatusAfterPosition', () => {
  it('moves when speed is above zero', () => {
    expect(getStatusAfterPosition(STATUS_IDLING, 20, 'online')).toBe(STATUS_MOVING);
  });
  it('becomes idling when a moving vehicle stops', () => {
    expect(getStatusAfterPosition(STATUS_MOVING, 0, 'online')).toBe(STATUS_IDLING);
  });
  it('goes offline when the socket says offline', () => {
    expect(getStatusAfterPosition(STATUS_MOVING, 0, 'offline')).toBe(STATUS_OFFLINE);
  });
  it('never changes a suspended vehicle', () => {
    expect(getStatusAfterPosition(STATUS_SUSPENDED, 30, 'online')).toBe(STATUS_SUSPENDED);
  });
});