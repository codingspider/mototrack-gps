import { formatBdDateTime, formatDateOnly, formatTimeAgo, getDaysLeft } from '../src/utils/formatDate';

describe('formatDateOnly', () => {
  it('formats a date or date-time as DD MMM YYYY', () => {
    expect(formatDateOnly('2026-10-31')).toBe('31 Oct 2026');
    expect(formatDateOnly('2026-10-31 00:00:00')).toBe('31 Oct 2026');
  });
  it('returns - for empty values', () => {
    expect(formatDateOnly(null)).toBe('-');
  });
});

describe('getDaysLeft', () => {
  // 2026-10-06 20:00 UTC is already 7 Oct 02:00 in Bangladesh
  const nowMs = Date.UTC(2026, 9, 6, 20, 0, 0);

  it('counts days from the Bangladesh date', () => {
    expect(getDaysLeft('2026-10-18', nowMs)).toBe(11);
    expect(getDaysLeft('2026-10-07', nowMs)).toBe(0);
  });
  it('is negative once the date has passed', () => {
    expect(getDaysLeft('2026-10-05', nowMs)).toBe(-2);
  });
  it('returns null when there is no date', () => {
    expect(getDaysLeft(null, nowMs)).toBeNull();
  });
});

describe('formatBdDateTime', () => {
  it('returns - for empty values', () => {
    expect(formatBdDateTime(null)).toBe('-');
  });
  it('converts unix seconds to Bangladesh time (UTC+6)', () => {
    // 2026-01-01 00:00:00 UTC -> 06:00 AM in Dhaka
    expect(formatBdDateTime(1767225600)).toBe('01 Jan 2026, 06:00 AM');
  });
  it('treats date strings as UTC', () => {
    expect(formatBdDateTime('2026-01-01 00:00:00')).toBe('01 Jan 2026, 06:00 AM');
  });
});

describe('formatTimeAgo', () => {
  const nowSeconds = 1767225600;
  const nowMs = nowSeconds * 1000;

  it('returns - for empty values', () => {
    expect(formatTimeAgo(null, nowMs)).toBe('-');
  });
  it('says Just now under one minute', () => {
    expect(formatTimeAgo(nowSeconds - 20, nowMs)).toBe('Just now');
  });
  it('shows minutes under one hour', () => {
    expect(formatTimeAgo(nowSeconds - 5 * 60, nowMs)).toBe('5 min ago');
  });
  it('shows hours under one day', () => {
    expect(formatTimeAgo(nowSeconds - 6 * 3600, nowMs)).toBe('6 hrs ago');
    expect(formatTimeAgo(nowSeconds - 3600, nowMs)).toBe('1 hr ago');
  });
  it('shows days after one day', () => {
    expect(formatTimeAgo(nowSeconds - 2 * 86400, nowMs)).toBe('2 days ago');
  });
});
