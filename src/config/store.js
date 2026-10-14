// Where the app lives in the Google Play Store. Used by "Rate this app" on the Profile screen.
// The id must be the applicationId of the release build (android/app/build.gradle).
export const ANDROID_PACKAGE = 'com.mototrackpro';

/** The app's Play Store page, opened in the Play Store app (market://) or, when it is missing, in the browser. */
export const PLAY_STORE_APP_URL = `market://details?id=${ANDROID_PACKAGE}`;
export const PLAY_STORE_WEB_URL = `https://play.google.com/store/apps/details?id=${ANDROID_PACKAGE}`;
