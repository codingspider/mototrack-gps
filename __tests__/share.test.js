// parseShare turns the /devices/{id}/share answer into the fields the app keeps.
import { parseShare } from '../src/store/slices/shareSlice';

const NOW_MS = 1790490000 * 1000;

describe('parseShare', () => {
  it('reads a live link', () => {
    const share = parseShare({ status: 1, shared: true, url: 'https://x/sharing/a', expires_at: 1790493116 }, NOW_MS);
    expect(share).toEqual({ isShared: true, url: 'https://x/sharing/a', expiresAt: 1790493116 });
  });

  it('treats a link past its time as no link', () => {
    const share = parseShare({ status: 1, shared: true, url: 'https://x/sharing/a', expires_at: 1790489000 }, NOW_MS);
    expect(share.isShared).toBe(false);
  });

  it('reads shared: false and an empty answer', () => {
    expect(parseShare({ status: 1, shared: false }, NOW_MS).isShared).toBe(false);
    expect(parseShare(null, NOW_MS)).toEqual({ isShared: false, url: '', expiresAt: null });
  });
});
