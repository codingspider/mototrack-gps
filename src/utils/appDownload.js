// Download a file into the phone's Downloads folder without opening the browser, through the native AppDownload
// module (android/app/src/main/java/com/mototrackpro/AppDownloadModule.kt, Android's DownloadManager).
import { Linking, NativeModules, PermissionsAndroid, Platform } from 'react-native';

const { AppDownload } = NativeModules;
const LAST_PERMISSION_API = 28; // Android 9 and older need the storage permission for the Downloads folder

/**
 * A safe file name made of a vehicle's name or plate: letters (also Bangla, with their vowel signs), digits,
 * dash and underscore only.
 * @param {string} text e.g. "ঢাকা মেট্রো ট ১১-৯৫৭১"
 * @param {string} fallback Used when nothing is left, e.g. "12"
 * @returns {string} e.g. "certificate-ঢাকা_মেট্রো_ট_১১-৯৫৭১.pdf"
 */
export function makeFileName(text, fallback) {
  const cleaned = String(text || '')
    .trim()
    .replace(/[^\p{L}\p{M}\p{N}_-]+/gu, '_')
    .replace(/^_+|_+$/g, '');
  return `certificate-${cleaned || fallback}.pdf`;
}

/**
 * @param {string} url Public link of the file
 * @param {string} fileName e.g. "certificate-DM_GA_32-4468.pdf"
 * @param {string} title Shown in the download notification
 * @returns {Promise<'downloading'|'browser'>} 'browser' when the module is missing and the link was handed to the browser
 */
export async function downloadFile(url, fileName, title) {
  if (Platform.OS !== 'android' || !AppDownload) {
    await Linking.openURL(url);
    return 'browser';
  }
  if (Platform.Version <= LAST_PERMISSION_API) {
    const result = await PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.WRITE_EXTERNAL_STORAGE);
    if (result !== PermissionsAndroid.RESULTS.GRANTED) {
      throw new Error('Allow storage permission to save the file');
    }
  }
  await AppDownload.downloadFile(url, fileName, title);
  return 'downloading';
}
