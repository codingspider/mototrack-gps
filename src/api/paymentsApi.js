// Renewal calls to the MotoTrack server: plans, the vehicles with their expiry date, and payment confirmation.
import client from './client';
import endpoints from './endpoints';

/**
 * Plans the customer can buy (GET /device-plans, V1\DevicePlansController@index).
 * {
 *   status: 1,
 *   items: [{ id, title, price, duration_type, duration_value, duration_text, description, formatted_price,
 *             device_types: [{ id, title }] }]   // device_types empty = the plan fits every device
 * }
 */
export async function getDevicePlans() {
  const response = await client.get(endpoints.devicePlans);
  return response.data;
}

/**
 * Every vehicle with its expiry date (GET /reports/payment-report?limit=1000, V1\PaymentReportController@index).
 * { status: 1, items: [{ device_id, name, plate_number, expiration_date: '2026-11-01' | null, is_expired, is_expiring_soon, ... }] }
 */
export async function getPayableVehicles() {
  const response = await client.get(endpoints.paymentReport, { params: { limit: 1000 } });
  return response.data;
}

/**
 * Tell the server a DGePay payment was made (POST /ipn, V1\IpnController@confirm). The server asks DGePay itself
 * whether it really succeeded and only then renews the vehicles. HTTP 200 with status 0 = not paid (yet).
 * Success: { status: 1, message, data: { transaction_id, plan_name, amount, periods, devices: [{ device_id,
 *   device_name, expiration_date, device_expiration, ... }], failed: [] } }
 * Failure: { status: 0, message: 'Transaction not completed. Status: ...' }
 * @param {{ deviceIds: number[], planId: number, amount: number, transactionId: string }} payment
 */
export async function confirmPayment({ deviceIds, planId, amount, transactionId }) {
  const response = await client.post(endpoints.ipn, {
    device_ids: deviceIds,
    plan_id: planId,
    amount,
    transaction_id: transactionId,
  });
  return response.data;
}
