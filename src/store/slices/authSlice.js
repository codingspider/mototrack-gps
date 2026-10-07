// Login session: the api hash (kept in memory + Keychain), user id and login/reset-password requests.
import { createAsyncThunk, createSlice } from '@reduxjs/toolkit';
import * as authApi from '../../api/authApi';
import { clearSession, loadSession, saveSession } from '../../utils/secureStorage';
import { disconnectSocket } from '../../socket/socketClient';
import { logout } from '../actions';

const initialState = {
  userApiHash: null,
  userId: null,
  isRestoring: true, // true until we checked Keychain on app start
  status: 'idle', // login request: 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
};

/** On app start: load the saved session from Keychain, if any. */
export const restoreSession = createAsyncThunk('auth/restoreSession', async () => {
  return await loadSession();
});

/** Log in and save the session. */
export const loginUser = createAsyncThunk(
  'auth/loginUser',
  async ({ emailOrPhone, password }, { rejectWithValue }) => {
    try {
      const data = await authApi.login(emailOrPhone, password);
      if (!data.user_api_hash || !data.userId) {
        return rejectWithValue('Login failed, please try again');
      }
      await saveSession(data.user_api_hash, data.userId);
      return { userApiHash: data.user_api_hash, userId: data.userId };
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
);

/** Clear the saved session, close the socket and reset all slices. */
export const logoutUser = createAsyncThunk('auth/logoutUser', async (_, { dispatch }) => {
  disconnectSocket();
  await clearSession();
  dispatch(logout());
});

const authSlice = createSlice({
  name: 'auth',
  initialState,
  reducers: {
    clearAuthError(state) {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(restoreSession.fulfilled, (state, action) => {
        state.isRestoring = false;
        if (action.payload) {
          state.userApiHash = action.payload.userApiHash;
          state.userId = action.payload.userId;
        }
      })
      .addCase(restoreSession.rejected, (state) => {
        state.isRestoring = false;
      })
      .addCase(loginUser.pending, (state) => {
        state.status = 'loading';
        state.error = null;
      })
      .addCase(loginUser.fulfilled, (state, action) => {
        state.status = 'succeeded';
        state.userApiHash = action.payload.userApiHash;
        state.userId = action.payload.userId;
      })
      .addCase(loginUser.rejected, (state, action) => {
        state.status = 'failed';
        state.error = action.payload || 'Login failed, please try again';
      })
      // Logout keeps isRestoring false so we land on Login, not a blank screen
      .addCase(logout, () => ({ ...initialState, isRestoring: false }));
  },
});

export const { clearAuthError } = authSlice.actions;
export default authSlice.reducer;

// Selectors
export const selectIsLoggedIn = (state) => !!state.auth.userApiHash;
export const selectUserId = (state) => state.auth.userId;