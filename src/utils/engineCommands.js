// The tracker commands for the engine cut-off relay, and how to read the server's answer.
// These are sent as "custom" GPRS commands. If a tracker model uses other texts, change them here only.

export const ENGINE_COMMANDS = {
  stop: 'RELAY,1#', // cuts the fuel / electricity
  resume: 'RELAY,0#', // restores it
};

/**
 * POST /send_gprs_command answers with HTTP 200 even when the command could not be sent:
 * { status: 1, message: 'Command sent' } on success, { status: 1, error: '...' } when the device refused it.
 * @param {object} data The response body
 * @returns {string|null} The error text, or null when the command was sent
 */
export function getCommandError(data) {
  if (!data) {
    return 'No answer from the server';
  }
  if (data.error) {
    return typeof data.error === 'string' ? data.error : 'The command could not be sent';
  }
  return data.status === 1 ? null : data.message || 'The command could not be sent';
}
