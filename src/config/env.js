// Server addresses and keys. HTTPS only. Secrets come from the git-ignored .env file, never from this file.
import {
  DGEPAY_API_KEY,
  DGEPAY_BASE_URL,
  DGEPAY_CLIENT_ID,
  DGEPAY_SECRET_KEY,
  GOOGLE_MAPS_API_KEY,
} from '@env';

export const API_BASE_URL = 'https://mototrack24.com/api';
export const SOCKET_URL = 'https://mototrack24.com';

// Same Google key the Android build puts in the manifest (see android/app/build.gradle). The JS side uses it
// only for the Street View picture. Empty when .env has no key.
export const MAPS_API_KEY = GOOGLE_MAPS_API_KEY || '';

// DGePay merchant settings (.env). The UAT (test) URL is the default, the same one the web portal uses, so a missing value can never charge real money.
export const DGEPAY = {
  baseUrl: DGEPAY_BASE_URL || 'https://api-uat.dgepay.net/dipon/v3',
  clientId: DGEPAY_CLIENT_ID || '',
  apiKey: DGEPAY_API_KEY || '',
  secretKey: DGEPAY_SECRET_KEY || '',
  // DGePay sends the customer here after paying; the payment screen catches it and never really loads it.
  returnUrl: `${SOCKET_URL}/p-return`,
  // Server-to-server notice address the web portal already uses.
  ipnUrl: `${SOCKET_URL}/payments/dgepay/webhook`,
};

/** True when the .env has everything DGePay needs. */
export const isDgepayConfigured = () => !!(DGEPAY.clientId && DGEPAY.apiKey && DGEPAY.secretKey);
