// A vehicle's fuel measurement: how the tracker's vehicle is measured (l/100km, MPG...), its rate and the fuel price.
import client from './client';
import endpoints from './endpoints';

/**
 * Read the device edit data (GET /edit_device_data?device_id=, DevicesController@edit). It is the same data the web
 * edit window loads, so it is large; the app only uses `item`:
 * { item: { id, name, fuel_measurement_id: 1, fuel_quantity: '40.00', fuel_price: '0.00', ... },
 *   device_fuel_measurements: [{ id, title }], ... }
 * NOT SEEN with a real response yet: the fields are read by those names, numbers may arrive as text.
 */
export async function getEditData(deviceId) {
  const response = await client.get(endpoints.editDeviceData, { params: { device_id: deviceId } });
  return response.data;
}

/**
 * Save the three fuel fields (POST /edit_device, DevicesController@update -> DeviceModalHelper::edit).
 * The server validates only the fields that are sent (`sometimes`), so nothing else on the vehicle changes.
 * Body: { id, fuel_measurement_id: 1..5, fuel_quantity, fuel_price }. Answer: { status: 1, id }.
 */
export async function saveFuelSettings({ deviceId, measurementId, quantity, price }) {
  const response = await client.post(endpoints.editDevice, {
    id: deviceId,
    fuel_measurement_id: measurementId,
    fuel_quantity: quantity,
    fuel_price: price,
  });
  return response.data;
}
