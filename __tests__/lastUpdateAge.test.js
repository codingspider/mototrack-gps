import { getLastUpdateAge } from '../src/utils/lastUpdateAge';

const NOW_SECONDS = 1790000000;
const NOW_MS = NOW_SECONDS * 1000;

describe('getLastUpdateAge', () => {
  it('is fresh within the hour', () => {
    expect(getLastUpdateAge(NOW_SECONDS - 59 * 60, NOW_MS)).toBe('fresh');
  });

  it('is old after 1 hour', () => {
    expect(getLastUpdateAge(NOW_SECONDS - 3600, NOW_MS)).toBe('old');
  });

  it('is stale after 1 day or with no time', () => {
    expect(getLastUpdateAge(NOW_SECONDS - 86400, NOW_MS)).toBe('stale');
    expect(getLastUpdateAge(null, NOW_MS)).toBe('stale');
  });
});
