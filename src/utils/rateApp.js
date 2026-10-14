// "Rate this app": opens the app's page in the Play Store, where the customer taps the stars and publishes the
// rating. Falls back to the Play Store web page when the Play Store app is not on the phone.
import { Linking } from 'react-native';
import { PLAY_STORE_APP_URL, PLAY_STORE_WEB_URL } from '../config/store';

/** @returns {Promise<boolean>} false when neither page could be opened */
export async function openPlayStoreRating() {
  try {
    await Linking.openURL(PLAY_STORE_APP_URL);
    return true;
  } catch (appError) {
    try {
      await Linking.openURL(PLAY_STORE_WEB_URL);
      return true;
    } catch (webError) {
      return false;
    }
  }
}
