// Engine stop / resume: the command texts, reading the server's answer, and what the slice does with it.
import { configureStore } from '@reduxjs/toolkit';
import * as commandsApi from '../src/api/commandsApi';
import commandsReducer, { sendEngineCommand } from '../src/store/slices/commandsSlice';
import { ENGINE_COMMANDS, getCommandError } from '../src/utils/engineCommands';

jest.mock('../src/api/commandsApi');

describe('getCommandError', () => {
  it('is null when the command was sent', () => {
    expect(getCommandError({ status: 1, message: 'Command sent' })).toBeNull();
  });

  it('reads the error the server puts next to status 1', () => {
    expect(getCommandError({ status: 1, error: 'Device is offline' })).toBe('Device is offline');
  });

  it('reads a failed status and an empty answer', () => {
    expect(getCommandError({ status: 0, message: 'No permission' })).toBe('No permission');
    expect(getCommandError(null)).toBe('No answer from the server');
  });
});

describe('sendEngineCommand', () => {
  const makeStore = () => configureStore({ reducer: { commands: commandsReducer, vehicles: (s = {}) => s } });

  beforeEach(() => {
    jest.useFakeTimers();
    commandsApi.sendCustomCommand.mockReset();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useRealTimers();
  });

  it('sends RELAY,1# to stop and RELAY,0# to resume', async () => {
    commandsApi.sendCustomCommand.mockResolvedValue({ status: 1, message: 'Command sent' });
    const store = makeStore();
    await store.dispatch(sendEngineCommand({ deviceId: 2, action: 'stop' }));
    await store.dispatch(sendEngineCommand({ deviceId: 2, action: 'resume' }));
    expect(commandsApi.sendCustomCommand).toHaveBeenNthCalledWith(1, 2, ENGINE_COMMANDS.stop);
    expect(commandsApi.sendCustomCommand).toHaveBeenNthCalledWith(2, 2, ENGINE_COMMANDS.resume);
    expect(ENGINE_COMMANDS).toEqual({ stop: 'RELAY,1#', resume: 'RELAY,0#' });
    expect(store.getState().commands.sendingDeviceId).toBeNull();
  });

  it('rejects with the device error even though the server answered status 1', async () => {
    commandsApi.sendCustomCommand.mockResolvedValue({ status: 1, error: 'Device is offline' });
    const store = makeStore();
    const result = await store.dispatch(sendEngineCommand({ deviceId: 2, action: 'stop' }));
    expect(sendEngineCommand.rejected.match(result)).toBe(true);
    expect(result.payload).toBe('Device is offline');
    expect(store.getState().commands.sendingDeviceId).toBeNull();
  });

  it('rejects with the network message', async () => {
    commandsApi.sendCustomCommand.mockRejectedValue(new Error('No internet connection'));
    const store = makeStore();
    const result = await store.dispatch(sendEngineCommand({ deviceId: 2, action: 'resume' }));
    expect(result.payload).toBe('No internet connection');
  });
});
