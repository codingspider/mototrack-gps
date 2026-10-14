import { FORCE_FROM_PRIORITY, isUpdateRequired } from '../src/utils/appUpdate';

describe('isUpdateRequired', () => {
  it('is false when Play has no newer version, or the check gave nothing', () => {
    expect(isUpdateRequired(null)).toBe(false);
    expect(isUpdateRequired(undefined)).toBe(false);
    expect(isUpdateRequired({ isAvailable: false, priority: 5 })).toBe(false);
  });

  it('forces every available update by default', () => {
    expect(FORCE_FROM_PRIORITY).toBe(0);
    expect(isUpdateRequired({ isAvailable: true, priority: 0 })).toBe(true);
    expect(isUpdateRequired({ isAvailable: true, priority: 3 })).toBe(true);
  });
});
