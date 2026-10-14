import { formatSinceTime, getStatusTimeText } from '../src/utils/statusTime';

// 2026-10-13 08:00:00 UTC is 14:00 in Bangladesh
const nowMs = Date.UTC(2026, 9, 13, 8, 0, 0);
const nowSeconds = Math.floor(nowMs / 1000);
const at = (hoursAgo) => nowSeconds - hoursAgo * 3600;

describe('formatSinceTime', () => {
  it('shows only the time for today (Bangladesh clock)', () => {
    // 3 hours ago = 11:00 AM in Bangladesh, the same day
    expect(formatSinceTime(at(3), nowMs)).toBe('11:00 AM');
  });

  it('adds the date for an earlier day', () => {
    // 30 hours ago = 08:00 AM on 12 Oct in Bangladesh
    expect(formatSinceTime(at(30), nowMs)).toBe('12 Oct, 08:00 AM');
  });

  it('uses the Bangladesh day, not the UTC day', () => {
    // 2026-10-13 19:00 UTC is 14 Oct 01:00 in Bangladesh: a new day there
    const lateNowMs = Date.UTC(2026, 9, 13, 19, 0, 0);
    const lateStamp = Math.floor(Date.UTC(2026, 9, 13, 17, 0, 0) / 1000); // 23:00 on 13 Oct in Bangladesh
    expect(formatSinceTime(lateStamp, lateNowMs)).toBe('13 Oct, 11:00 PM');
  });
});

describe('getStatusTimeText', () => {
  it('says since when for Engine Off and Idling, not when the tracker last reported', () => {
    const parked = { status: 'Engine Off', engine_changed_stamp: at(3), last_position_stamp: at(0.02) };
    expect(getStatusTimeText(parked, undefined, nowMs)).toBe('since 11:00 AM');
    const idling = { status: 'Idling', engine_changed_stamp: at(1), last_position_stamp: nowSeconds };
    expect(getStatusTimeText(idling, undefined, nowMs)).toBe('since 01:00 PM');
  });

  it('keeps the last report time for Moving and Offline', () => {
    const moving = { status: 'Moving', engine_changed_stamp: at(5), last_position_stamp: nowSeconds - 120 };
    expect(getStatusTimeText(moving, undefined, nowMs)).toBe('2 min ago');
    const offline = { status: 'Offline', engine_changed_stamp: at(5), last_position_stamp: at(2) };
    expect(getStatusTimeText(offline, undefined, nowMs)).toBe('2 hrs ago');
  });

  it('falls back to the last report when the server did not send the engine time', () => {
    const noStamp = { status: 'Engine Off', last_position_stamp: at(2) };
    expect(getStatusTimeText(noStamp, undefined, nowMs)).toBe('2 hrs ago');
    const empty = { status: 'Engine Off', engine_changed_stamp: -62169984000, last_position_stamp: at(2) };
    expect(getStatusTimeText(empty, undefined, nowMs)).toBe('2 hrs ago');
  });
});
