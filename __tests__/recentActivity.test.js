// Home "Recent Activities": every vehicle that moved in the last 3 hours.
import { RECENT_ACTIVITY_HOURS, getRecentActivityVehicles } from '../src/utils/recentActivity';

const NOW_MS = 1790490000 * 1000;
const NOW_S = 1790490000;
const HOUR = 3600;

const make = (id, status, { movedAgo, reportedAgo = 30, engine = false } = {}) => ({
  id,
  status,
  engine_status: engine,
  last_moved_stamp: movedAgo === undefined ? undefined : movedAgo === null ? null : NOW_S - movedAgo,
  last_position_stamp: NOW_S - reportedAgo,
});

const ids = (list) => getRecentActivityVehicles(list, NOW_MS).map((vehicle) => vehicle.id);

describe('getRecentActivityVehicles', () => {
  it('uses a 3 hour window', () => {
    expect(RECENT_ACTIVITY_HOURS).toBe(3);
  });

  it('keeps every vehicle that moved in the last 3 hours, even if it is parked or offline now', () => {
    const list = [
      make(1, 'Moving', { movedAgo: 60 }),
      make(2, 'Engine Off', { movedAgo: 2 * HOUR }),
      make(3, 'Offline', { movedAgo: HOUR }),
      make(4, 'Idling', { movedAgo: 2.5 * HOUR }),
    ];
    expect(ids(list)).toEqual([1, 3, 2, 4]);
  });

  it('keeps a vehicle moving now even when its moved time is unknown or looks old', () => {
    const list = [make(1, 'Moving', { movedAgo: null }), make(2, 'Moving', { movedAgo: 7 * HOUR })];
    expect(ids(list).sort()).toEqual([1, 2]);
  });

  it('drops a vehicle that only idles or has its engine on without moving', () => {
    const list = [
      make(1, 'Idling', { movedAgo: null }),
      make(2, 'Engine Off', { movedAgo: null, engine: true }),
      make(3, 'Idling', { movedAgo: 5 * HOUR, engine: true }),
    ];
    expect(ids(list)).toEqual([]);
  });

  it('drops a parked vehicle that moved more than 3 hours ago, or whose moved time is unknown', () => {
    const list = [
      make(1, 'Engine Off', { movedAgo: 3 * HOUR + 60 }),
      make(2, 'Engine Off', { movedAgo: null }),
      make(3, 'Engine Off'),
    ];
    expect(ids(list)).toEqual([]);
  });

  it('drops suspended vehicles', () => {
    expect(ids([make(1, 'Suspended', { movedAgo: 60, engine: true })])).toEqual([]);
  });

  it('drops a "moving" vehicle that stopped reporting more than 3 hours ago', () => {
    expect(ids([make(1, 'Moving', { movedAgo: null, reportedAgo: 3 * HOUR + 60 })])).toEqual([]);
  });

  it('puts the vehicle that moved last first', () => {
    const list = [
      make(1, 'Moving', { movedAgo: 3000, reportedAgo: 3000 }),
      make(2, 'Engine Off', { movedAgo: 60 }),
      make(3, 'Offline', { movedAgo: 1500 }),
    ];
    expect(ids(list)).toEqual([2, 3, 1]);
  });
});
