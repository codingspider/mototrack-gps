import { formatBdDateTime, formatTimeAgo } from '../src/utils/formatDate';

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
