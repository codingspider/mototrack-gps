// Tracker commands (engine stop / resume). Only remembers which vehicle a command is being sent to, so its buttons
// are disabled; the real engine state is the vehicle's own `details.engine_blocked`, read back from the server.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as commandsApi from '../../api/commandsApi';
import { ENGINE_COMMANDS, getCommandError } from '../../utils/engineCommands';
import { logout } from '../actions';
import { fetchVehicleDetails } from './vehiclesSlice';

const READ_BACK_DELAY_MS = 6000; // the tracker needs a few seconds to obey and report its new state

/**
 * @param {{ deviceId: number, action: 'stop' | 'resume' }} request
 * @returns {Promise<{ deviceId, action }>} Rejects with the error text when the command could not be sent
 */
export const sendEngineCommand = createAsyncThunk(
  'commands/sendEngineCommand',
  async ({ deviceId, action }, { dispatch, rejectWithValue }) => {
    try {
      const data = await commandsApi.sendCustomCommand(deviceId, ENGINE_COMMANDS[action]);
      const errorText = getCommandError(data);
      if (errorText) {
        return rejectWithValue(errorText);
      }
      // Read the vehicle back once the tracker had time to answer (engine_blocked comes from its sensor)
      setTimeout(() => dispatch(fetchVehicleDetails({ id: deviceId, force: true })), READ_BACK_DELAY_MS);
      return { deviceId, action };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

const commandsSlice = createSlice({
  name: 'commands',
  initialState: { sendingDeviceId: null },
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(sendEngineCommand.pending, (state, action) => {
        state.sendingDeviceId = action.meta.arg.deviceId;
      })
      .addCase(sendEngineCommand.fulfilled, (state) => {
        state.sendingDeviceId = null;
      })
      .addCase(sendEngineCommand.rejected, (state) => {
        state.sendingDeviceId = null;
      })
      .addCase(logout, () => ({ sendingDeviceId: null }));
  },
});

export default commandsSlice.reducer;

// Selectors
export const selectSendingDeviceId = (state) => state.commands.sendingDeviceId;
