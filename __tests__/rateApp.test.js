// "Rate this app" opens the Play Store app page, and the web page when the Play Store app is missing.
import { Linking } from 'react-native';
import { PLAY_STORE_APP_URL, PLAY_STORE_WEB_URL } from '../src/config/store';
import { openPlayStoreRating } from '../src/utils/rateApp';

describe('openPlayStoreRating', () => {
  // In the React Native jest preset Linking.openURL is already a mock: forget the calls of the earlier test
  beforeEach(() => {
    Linking.openURL.mockReset();
  });

  it('opens the Play Store app page', async () => {
    const open = jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
    await expect(openPlayStoreRating()).resolves.toBe(true);
    expect(open).toHaveBeenCalledTimes(1);
    expect(open).toHaveBeenCalledWith(PLAY_STORE_APP_URL);
  });

  it('falls back to the web page when the Play Store app cannot be opened', async () => {
    const open = jest
      .spyOn(Linking, 'openURL')
      .mockRejectedValueOnce(new Error('no market app'))
      .mockResolvedValueOnce(true);
    await expect(openPlayStoreRating()).resolves.toBe(true);
    expect(open).toHaveBeenNthCalledWith(2, PLAY_STORE_WEB_URL);
  });

  it('says false when nothing can be opened', async () => {
    jest.spyOn(Linking, 'openURL').mockRejectedValue(new Error('nothing'));
    await expect(openPlayStoreRating()).resolves.toBe(false);
  });

  it('points at the app id of the build', () => {
    expect(PLAY_STORE_APP_URL).toBe('market://details?id=com.mototrackpro');
    expect(PLAY_STORE_WEB_URL).toContain('play.google.com/store/apps/details?id=com.mototrackpro');
  });
});
