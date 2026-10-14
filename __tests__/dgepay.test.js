// DGePay signing / encryption must match what the server's PHP (OpenSSL) produces and accepts.
/* global Buffer */
import nodeCrypto from 'crypto';
import {
  buildChecksumString,
  buildInitiatePayload,
  createBasicAuth,
  createSignature,
  createTransactionId,
  encryptBody,
  toJsonBody,
} from '../src/utils/dgepay';
import { MAX_QUANTITY, formatMoney, getCartTotal, getExpiryLabel } from '../src/utils/payments';

const SECRET = 'testsecretkey1234567890';
const API_KEY = 'test-api-key';

const payload = buildInitiatePayload({
  amount: 1800,
  note: 'Test Device Plan',
  transactionId: 'MOTO-APP-1790000000000-abc123',
  returnUrl: 'https://mototrack24.com/p-return',
  ipnUrl: 'https://mototrack24.com/payments/dgepay/webhook',
});

describe('buildChecksumString', () => {
  it('sorts keys, walks nested objects, writes null and a decimal amount', () => {
    const text = buildChecksumString({ b: 'x y', amount: 300, a: null, n: { z: 'a:b', y: 1 } });
    expect(text).toBe('anullamount300.0bxyny1zab');
  });

  it('keeps a fractional amount as it is', () => {
    expect(buildChecksumString({ amount: 12.5 })).toBe('amount12.5');
  });

  it('builds the full initiate_payment text like the server does', () => {
    expect(buildChecksumString(payload)).toBe(
      'amount1800.0customer_tokennullipn_redirect_urlhttps//mototrack24.com/payments/dgepay/webhook' +
        'meta_datacustom_field_1MOTO-APP-1790000000000-abc123custom_field_2device_plancustom_field_3mobile_app' +
        'noteTestDevicePlanpayee_informationdial_code+880phone_number' +
        'payment_methodnullredirect_urlhttps//mototrack24.com/p-returnunique_txn_idMOTO-APP-1790000000000-abc123',
    );
  });
});

describe('signature and encryption', () => {
  it('signs with HMAC-SHA256 (base64) like hash_hmac(..., true)', () => {
    const expected = nodeCrypto.createHmac('sha256', API_KEY).update(buildChecksumString(payload)).digest('base64');
    expect(createSignature(payload, API_KEY)).toBe(expected);
  });

  it('encrypts with AES-128-ECB and the first 16 characters of the secret like openssl_encrypt', () => {
    const json = toJsonBody(payload);
    const cipher = nodeCrypto.createCipheriv('aes-128-ecb', Buffer.from(SECRET.slice(0, 16)), null);
    const expected = Buffer.concat([cipher.update(json, 'utf8'), cipher.final()]).toString('base64');
    expect(encryptBody(json, SECRET)).toBe(expected);
  });

  it('writes a whole amount with .0 like PHP json_encode of a float', () => {
    expect(toJsonBody(payload)).toContain('"amount":1800.0,');
    expect(toJsonBody({ ...payload, amount: 12.5 })).toContain('"amount":12.5,');
  });
});

describe('createBasicAuth', () => {
  it('is base64 of client:secret', () => {
    expect(createBasicAuth('client', 'secret')).toBe(Buffer.from('client:secret').toString('base64'));
  });
});

describe('createTransactionId', () => {
  it('has the MOTO-APP prefix, the time and a 6 character random part', () => {
    expect(createTransactionId(1790000000000, 0.5)).toBe('MOTO-APP-1790000000000-7fffff');
  });
});

describe('renewal maths', () => {
  it('multiplies price x periods x vehicles', () => {
    expect(getCartTotal(300, 2, 3)).toBe(1800);
    expect(getCartTotal('0.1', 3, 1)).toBe(0.3);
    expect(getCartTotal(300, 1, 0)).toBe(0);
  });

  it('formats money with a thousands separator', () => {
    expect(formatMoney(1800)).toBe('৳ 1,800');
    expect(formatMoney(12.5)).toBe('৳ 12.50');
  });

  it('labels the expiry date', () => {
    const now = Date.UTC(2026, 9, 10, 6, 0, 0);
    expect(getExpiryLabel(null, now)).toEqual({ text: 'No expiry', tone: 'neutral' });
    expect(getExpiryLabel('2026-10-01', now)).toEqual({ text: 'Expired', tone: 'danger' });
    expect(getExpiryLabel('2026-10-15', now)).toEqual({ text: '5 days left', tone: 'warning' });
    expect(getExpiryLabel('2027-01-15', now).tone).toBe('success');
  });

  it('allows up to 12 periods like the server', () => {
    expect(MAX_QUANTITY).toBe(12);
  });
});

describe('getRenewalNotice', () => {
  const { getRenewalNotice, REMIND_DAYS } = require('../src/utils/payments');
  const now = Date.UTC(2026, 9, 10, 6, 0, 0); // 10 Oct 2026, noon in Bangladesh

  it('is quiet when there is no date or plenty of time', () => {
    expect(getRenewalNotice(null, now)).toBeNull();
    expect(getRenewalNotice('2026-12-31', now)).toBeNull();
    expect(getRenewalNotice('2026-10-18', now)).toBeNull(); // 8 days left: still quiet
    expect(REMIND_DAYS).toBe(7);
  });

  it('says it is expiring soon', () => {
    const notice = getRenewalNotice('2026-10-15', now);
    expect(notice).toMatchObject({ level: 'soon', daysLeft: 5, title: 'Service expiring soon' });
    expect(notice.message).toContain('in 5 days');
    expect(getRenewalNotice('2026-10-10', now).message).toContain('today');
    expect(getRenewalNotice('2026-10-17', now).level).toBe('soon'); // exactly 7 days
  });

  it('says it has expired', () => {
    const notice = getRenewalNotice('2026-10-07 20:14:58', now);
    expect(notice).toMatchObject({ level: 'expired', daysLeft: -3, title: 'Service expired' });
    expect(notice.message).toContain('3 days ago');
  });
});
