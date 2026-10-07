// Shared actions. Kept in their own file so slices and the api layer can import them without circular imports.
import { createAction } from '@reduxjs/toolkit';

// Every slice resets to its initial state when this runs.
export const logout = createAction('auth/logout');