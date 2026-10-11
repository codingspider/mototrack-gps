// Send a command to a tracker (engine cut-off and resume).
import client from './client';
import endpoints from './endpoints';

/**
 * Send a custom GPRS command (POST /send_gprs_command, SendCommandController@gprsStore).
 * Body: { device_id: 2, type: 'custom', data: 'RELAY,0#' }
 * Answers: { status: 1, message: 'Command sent' }
 *          { status: 1, error: '...' }          (HTTP 200 but the device refused it)
 *          HTTP 422 { status: 0, errors: {...} } (validation, e.g. the user may not send commands)
 * @param {number} deviceId
 * @param {string} command The command text, e.g. 'RELAY,1#'
 */
export async function sendCustomCommand(deviceId, command) {
  const response = await client.post(endpoints.sendGprsCommand, {
    device_id: deviceId,
    type: 'custom',
    data: command,
  });
  return response.data;
}
