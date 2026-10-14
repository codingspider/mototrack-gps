// The digits of the odometer boxes on the vehicle details page. Pure functions.

/**
 * Turn a distance into boxes: 6057.4 with (6, 1) gives 0 0 6 0 5 7 and the decimal 4.
 * A number that does not fit stays at the biggest the boxes can show (all nines).
 * @param {number|string|null} value Distance in km
 * @param {number} integerDigits How many boxes before the decimal point
 * @param {number} decimalDigits How many boxes after it
 * @returns {Array<{ char: string, isDecimal: boolean }>|null} null when the distance is not known yet
 */
export function getOdometerDigits(value, integerDigits, decimalDigits = 0) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number) || number < 0) {
    return null;
  }
  const total = integerDigits + decimalDigits;
  const biggest = 10 ** total - 1;
  const scaled = Math.min(Math.round(number * 10 ** decimalDigits), biggest);
  const text = String(scaled).padStart(total, '0');
  return text.split('').map((char, index) => ({ char, isDecimal: index >= integerDigits }));
}
