// A vehicle's fuel measurement (the same three fields as the web device edit window) and the estimate built from it.
// Server meaning (convertFuelConsumption in the web repo): the rate is stored per kilometer, or per hour for l/h.

// The ids are fixed by the server (validation `in:1,2,3,4,5`).
export const FUEL_MEASUREMENTS = [
  { id: 1, title: 'l/100km', quantityLabel: 'Liters per 100 kilometers', priceLabel: 'Cost per liter', unit: 'L' },
  { id: 5, title: 'km/l', quantityLabel: 'Kilometers per liter', priceLabel: 'Cost per liter', unit: 'L' },
  { id: 2, title: 'MPG', quantityLabel: 'Miles per gallon', priceLabel: 'Cost per gallon', unit: 'L' },
  { id: 4, title: 'l/h', quantityLabel: 'Liters per hour of engine on', priceLabel: 'Cost per liter', unit: 'L' },
  { id: 3, title: 'kWh/km', quantityLabel: 'Kilowatt-hours per kilometer', priceLabel: 'Cost per kWh', unit: 'kWh' },
];

const LITERS_PER_GALLON = 3.78541;
const KM_PER_MILE = 1.609344;

/** @param {number|null} id Measurement id from the server */
export function getMeasurement(id) {
  return FUEL_MEASUREMENTS.find((item) => item.id === Number(id)) || null;
}

/**
 * Read the three fuel fields from GET /edit_device_data (`item` is the device row; numbers arrive as text).
 * @returns {{ measurementId: number|null, quantity: number, price: number }}
 */
export function parseFuelSettings(data) {
  const item = (data && data.item) || {};
  const id = Number(item.fuel_measurement_id);
  return {
    measurementId: getMeasurement(id) ? id : null,
    quantity: Number(item.fuel_quantity) || 0,
    price: Number(item.fuel_price) || 0,
  };
}

/**
 * Fuel the vehicle is expected to have used, from its rate: distance x rate (or engine hours x rate for l/h).
 * @param {{ measurementId: number|null, quantity: number, price: number }} settings
 * @param {number|null} distanceKm
 * @param {number|null} engineSeconds Engine-on time (needed for l/h only)
 * @returns {{ amount: number, unit: string, cost: number|null }|null} null when it cannot be worked out
 */
export function estimateFuel(settings, distanceKm, engineSeconds) {
  const measurement = settings && getMeasurement(settings.measurementId);
  if (!measurement || !(settings.quantity > 0)) {
    return null;
  }
  let amount = null;
  const { measurementId, quantity } = settings;
  if (measurementId === 4) {
    amount = engineSeconds === null || engineSeconds === undefined ? null : (engineSeconds / 3600) * quantity;
  } else if (distanceKm === null || distanceKm === undefined) {
    amount = null;
  } else if (measurementId === 1) {
    amount = (distanceKm * quantity) / 100;
  } else if (measurementId === 5) {
    amount = distanceKm / quantity;
  } else if (measurementId === 2) {
    amount = (distanceKm / (quantity * KM_PER_MILE)) * LITERS_PER_GALLON;
  } else if (measurementId === 3) {
    amount = distanceKm * quantity;
  }
  if (amount === null) {
    return null;
  }
  // The price is per gallon for MPG (as the server treats it), otherwise per liter / per kWh
  const pricePerUnit = measurementId === 2 ? settings.price / LITERS_PER_GALLON : settings.price;
  return {
    amount: Math.round(amount * 10) / 10,
    unit: measurement.unit,
    cost: settings.price > 0 ? Math.round(amount * pricePerUnit) : null,
  };
}

/**
 * Check the form before sending. Empty fields count as 0 (no rate / no price), like the web form.
 * @returns {string|null} A message, or null when fine
 */
export function validateFuelForm({ measurementId, quantity, price }) {
  if (!getMeasurement(measurementId)) {
    return 'Choose how fuel is measured';
  }
  const quantityNumber = Number(quantity === '' ? 0 : quantity);
  const priceNumber = Number(price === '' ? 0 : price);
  if (!Number.isFinite(quantityNumber) || quantityNumber < 0) {
    return 'Enter a valid fuel rate';
  }
  if (!Number.isFinite(priceNumber) || priceNumber < 0) {
    return 'Enter a valid fuel price';
  }
  return null;
}
