// Talks to DGePay directly to start a payment (the same two calls the web portal makes on its server).
// Plain fetch on purpose: DGePay is not our server, so it must never get the MotoTrack user_api_hash.
// The server still decides the result: after paying, POST /ipn makes the MotoTrack server verify it with DGePay.
import { DGEPAY, isDgepayConfigured } from '../config/env';
import {
  buildInitiatePayload,
  createBasicAuth,
  createSignature,
  createTransactionId,
  encryptBody,
  toJsonBody,
} from '../utils/dgepay';

const TIMEOUT_MS = 20000;

/** fetch with a timeout, so a dead connection does not leave the button spinning forever. */
async function fetchWithTimeout(url, options) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    return await fetch(url, { ...options, signal: controller.signal });
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new Error('The payment service took too long to respond, please try again');
    }
    throw new Error('No internet connection');
  } finally {
    clearTimeout(timer);
  }
}

/**
 * Get a token (POST {base}/payment_gateway/authenticate with Basic client_id:secret_key).
 * The token is in `token`, `access_token`, `data.access_token` or `data.token`.
 */
async function authenticate() {
  const basic = createBasicAuth(DGEPAY.clientId, DGEPAY.secretKey);
  const response = await fetchWithTimeout(`${DGEPAY.baseUrl}/payment_gateway/authenticate`, {
    method: 'POST',
    headers: { Authorization: `Basic ${basic}`, 'Content-Type': 'application/json', Accept: 'application/json' },
  });
  const data = await response.json().catch(() => null);
  const token = data && (data.token || data.access_token || (data.data && (data.data.access_token || data.data.token)));
  if (!response.ok || !token) {
    throw new Error('Could not connect to the payment service. Please try again in a few minutes.');
  }
  return token;
}

/**
 * Start a payment and get the DGePay page address.
 * POST {base}/payment_gateway/initiate_payment, body = encrypted JSON, header Signature = HMAC of the fields.
 * The page address is in `redirect_url`, `payment_url`, `data.webview_url` or `data.redirect_url`.
 * @param {{ amount: number, note: string }} options amount = the total for all vehicles
 * @returns {Promise<{ transactionId: string, paymentUrl: string }>}
 */
export async function startDgepayPayment({ amount, note }) {
  if (!isDgepayConfigured()) {
    throw new Error('Payments are not set up in this app build yet (DGePay keys are missing in .env)');
  }
  const transactionId = createTransactionId();
  const payload = buildInitiatePayload({
    amount,
    note,
    transactionId,
    returnUrl: DGEPAY.returnUrl,
    ipnUrl: DGEPAY.ipnUrl,
  });
  const token = await authenticate();
  const response = await fetchWithTimeout(`${DGEPAY.baseUrl}/payment_gateway/initiate_payment`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      Signature: createSignature(payload, DGEPAY.apiKey),
      'Content-Type': 'text/plain',
    },
    body: encryptBody(toJsonBody(payload), DGEPAY.secretKey),
  });
  const data = await response.json().catch(() => null);
  const paymentUrl =
    data && (data.redirect_url || data.payment_url || (data.data && (data.data.webview_url || data.data.redirect_url)));
  if (!response.ok || !paymentUrl) {
    throw new Error('The payment could not be started. Please try again in a few minutes.');
  }
  return { transactionId, paymentUrl };
}
