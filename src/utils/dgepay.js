// DGePay request signing and encryption. Same steps as the web portal's DgepayGateway.php, so the server accepts them.
// Pure functions (no network), covered by __tests__/dgepay.test.js.
import CryptoJS from 'crypto-js';

/** A key is "plain" when it is a value, not a nested object / list of objects. */
function isNestedObject(value) {
  return value !== null && typeof value === 'object' && !Array.isArray(value);
}

/**
 * The text DGePay signs: keys sorted A-Z, each key followed by its value. Nested objects are walked inside.
 * null becomes "null", `amount` always has a decimal part ("300" -> "300.0"), spaces and ":" are removed.
 * @param {object} payload
 * @returns {string}
 */
export function buildChecksumString(payload) {
  const parts = [];
  const walk = (object) => {
    Object.keys(object)
      .sort()
      .forEach((key) => {
        const value = object[key];
        parts.push(key);
        if (value === null || value === undefined) {
          parts.push('null');
          return;
        }
        if (isNestedObject(value)) {
          walk(value);
          return;
        }
        let text = String(value);
        if (key === 'amount' && Number.isInteger(Number(value))) {
          text = `${Number(value)}.0`;
        }
        parts.push(text.replace(/\s+/g, '').replace(/:/g, ''));
      });
  };
  walk(payload);
  return parts.join('');
}

/** HMAC-SHA256 of the checksum text with the API key, base64. Sent as the `Signature` header. */
export function createSignature(payload, apiKey) {
  return CryptoJS.HmacSHA256(buildChecksumString(payload), apiKey).toString(CryptoJS.enc.Base64);
}

/**
 * JSON like PHP's json_encode: a whole `amount` is written "300.0", not "300", and slashes stay as they are.
 * @param {object} payload
 */
export function toJsonBody(payload) {
  const json = JSON.stringify(payload);
  if (Number.isInteger(payload.amount)) {
    return json.replace(`"amount":${payload.amount},`, `"amount":${payload.amount}.0,`);
  }
  return json;
}

/** AES-128-ECB with the first 16 characters of the secret key, base64. This is the request body. */
export function encryptBody(jsonText, secretKey) {
  const key = CryptoJS.enc.Utf8.parse(secretKey.slice(0, 16));
  const encrypted = CryptoJS.AES.encrypt(jsonText, key, { mode: CryptoJS.mode.ECB, padding: CryptoJS.pad.Pkcs7 });
  return encrypted.toString();
}

/** The value of the Basic authorization header: base64("clientId:secretKey"). */
export function createBasicAuth(clientId, secretKey) {
  return CryptoJS.enc.Base64.stringify(CryptoJS.enc.Utf8.parse(`${clientId}:${secretKey}`));
}

/** A transaction id the server can recognise as an app payment: MOTO-APP-<time>-<random>. */
export function createTransactionId(nowMs = Date.now(), randomPart = Math.random()) {
  const random = Math.floor(randomPart * 0xffffff).toString(16).padStart(6, '0');
  return `MOTO-APP-${nowMs}-${random}`;
}

/**
 * The initiate_payment body.
 * @param {{ amount: number, note: string, transactionId: string, returnUrl: string, ipnUrl: string }} options
 */
export function buildInitiatePayload({ amount, note, transactionId, returnUrl, ipnUrl }) {
  return {
    amount,
    customer_token: null,
    note,
    payee_information: { dial_code: '+880', phone_number: '' },
    payment_method: null,
    redirect_url: returnUrl,
    ipn_redirect_url: ipnUrl,
    unique_txn_id: transactionId,
    meta_data: { custom_field_1: transactionId, custom_field_2: 'device_plan', custom_field_3: 'mobile_app' },
  };
}
