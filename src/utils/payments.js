// Renewal maths and labels. Pure functions; the server still decides the real price and expiry.
import { getDaysLeft } from './formatDate';

export const CURRENCY_SYMBOL = '৳';
export const MAX_QUANTITY = 12; // the server accepts 1 to 12 periods

/** "৳ 1,800" (no decimals when the amount is whole, two otherwise). */
export function formatMoney(amount) {
  const number = Number(amount) || 0;
  const text = Number.isInteger(number) ? String(number) : number.toFixed(2);
  return `${CURRENCY_SYMBOL} ${text.replace(/\B(?=(\d{3})+(?!\d))/g, ',')}`;
}

/**
 * Total to pay: plan price x periods x number of vehicles (the same sum the web page shows).
 * Rounded to 2 decimals so 0.1 + 0.2 style errors never reach the payment.
 */
export function getCartTotal(planPrice, quantity, vehicleCount) {
  const total = (Number(planPrice) || 0) * quantity * vehicleCount;
  return Math.round(total * 100) / 100;
}

/** The label on the right of a vehicle row: "No expiry", "Expired", "12 days left"... */
export function getExpiryLabel(expirationDate, nowMs = Date.now()) {
  const daysLeft = getDaysLeft(expirationDate, nowMs);
  if (daysLeft === null) {
    return { text: 'No expiry', tone: 'neutral' };
  }
  if (daysLeft < 0) {
    return { text: 'Expired', tone: 'danger' };
  }
  return { text: `${daysLeft} ${daysLeft === 1 ? 'day' : 'days'} left`, tone: daysLeft <= 30 ? 'warning' : 'success' };
}
