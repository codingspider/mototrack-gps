// Server addresses and keys. HTTPS only. Secrets come from the git-ignored .env file, never from this file.
import { GOOGLE_MAPS_API_KEY } from '@env';

export const API_BASE_URL = 'https://mototrack24.com/api';
export const SOCKET_URL = 'https://mototrack24.com';

// Same Google key the Android build puts in the manifest (see android/app/build.gradle). The JS side uses it
// only for the Street View picture. Empty when .env has no key.
export const MAPS_API_KEY = GOOGLE_MAPS_API_KEY || '';
