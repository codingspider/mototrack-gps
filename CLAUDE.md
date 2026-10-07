 # CLAUDE.md — MotoTrack24 Mobile App (React Native)

This file tells the coding agent (and any developer) how to build and change this app.
Read it fully before writing code. When a rule here conflicts with a habit, the rule wins.

---

## 1. What we are building

**MotoTrack24** customer app for Android (iOS later) — the mobile version of the MotoTrack GPS
vehicle-tracking web portal (https://mototrack24.com).

- Backend: existing **GPSWox (Tobuli) Laravel 8** app. We do **not** build a new backend.
  The app only talks to the existing `/api/*` endpoints and the existing **Socket.IO** server.
- Users in v1: **customers only** (people who own vehicles). No admin, no Regional Head / Sales screens yet.
  Do not add admin or staff features unless asked.
- UI: same features as the customer web panel, but cleaner and more mobile-friendly.
- All dates and times are shown in **Bangladesh time (Asia/Dhaka, UTC+6)**, always.

### Tech stack (fixed — do not swap libraries without asking)

| Area | Library | Notes |
|---|---|---|
| Framework | **React Native CLI** (bare, no Expo) | |
| Language | **JavaScript** (no TypeScript) | Use JSDoc comments for important function params |
| Navigation | `@react-navigation/native` + native-stack + bottom-tabs | All routes live in `src/routes/` |
| State | **Redux Toolkit** (`@reduxjs/toolkit`) + `react-redux` | The ONLY place for shared/server data |
| HTTP | `axios` | One shared client in `src/api/client.js` |
| Real-time | **`socket.io-client@2.x`** | ⚠️ Must be v2 — the server runs socket.io 2.1. A v3/v4 client will NOT connect. |
| UI components | **`react-native-paper`** (`npm install react-native-paper`) | Buttons, inputs, cards, icons, ripples. Themed once in `src/theme/paperTheme.js` from our color tokens, provided in `App.js` with `PaperProvider`. Needs `react-native-safe-area-context` and `react-native-vector-icons` (already installed). |
| Maps | `react-native-maps` (Google provider) | |
| Secure storage | `react-native-keychain` | Stores `user_api_hash` |
| Normal storage | `@react-native-async-storage/async-storage` | Non-secret settings only |
| Dates | `dayjs` + `utc` + `timezone` plugins | Always convert to `Asia/Dhaka` |
| Hashing | `js-md5` | Needed for the socket room name |
| Icons | `react-native-vector-icons` (MaterialCommunityIcons) | |
| Lint/format | ESLint (`@react-native/eslint-config`) + Prettier | |
| Tests | Jest (comes with RN) | Test reducers and utils first |

Use the latest stable versions at setup time, except `socket.io-client` which stays on `^2`.

---

## 2. Golden rules (read these twice)

1. **Beginner-friendly code first.** A junior developer must understand any file in 5 minutes.
   Prefer simple, explicit code over clever code. No magic helpers, no deep abstractions,
   no HOCs, no custom Redux middleware factories.
2. **One source of truth.** Server data (vehicles, positions, profile, reports, plans…) lives in
   **Redux only**. Pages read it with `useSelector`. Never copy server data into `useState`.
   Every page that shows a vehicle must show the **same** speed, status and position at the same moment.
3. **Fetch once, share everywhere.** A page only fetches if the data is not loaded yet or is stale.
   Opening another page must not refetch the same list.
4. **Real-time via socket, not polling.** Live positions come from the Socket.IO `position` event.
   Do not add `setInterval` polling for positions.
5. **Skeletons, not spinners,** for page loading. Every page that loads data has a skeleton.
6. **Theme tokens only.** Never write a raw hex color, font size or spacing number inside a component.
   Import from `src/theme`.
6a. **Paper components, wrapped once.** Build UI from `react-native-paper` (`Button`, `TextInput`,
   `Surface`, `Icon`, `IconButton`, `TouchableRipple`, `HelperText`…). Pages use our wrappers in
   `src/components/common/` (`AppButton`, `AppInput`, `AppText`, `Card`) instead of importing Paper
   directly where a wrapper exists, so a look change is made in one place. Page-only pieces may use
   Paper directly. Always pass colors from `src/theme`, never Paper's defaults.
7. **Keep folders separate:** API calls only in `src/api/`, navigation only in `src/routes/`,
   screens only in `src/pages/`, reusable UI only in `src/components/`.
8. **Small files.** One component per file. Aim for < 200 lines per file. If bigger, split it.
9. **Do only what was asked.** Do not refactor unrelated files or rename things "while you are there".
10. **Never change the backend from this repo.** If an endpoint is missing or wrong, stop and
    describe the needed backend change (route, controller, response shape) to the user instead.

---

## 3. Folder structure

```
mototrack-app/
├── App.js                      # Wraps <Provider store> + <NavigationContainer> + <RootNavigator>
├── index.js
├── CLAUDE.md
├── .env.example                # API_BASE_URL, SOCKET_URL (no secrets committed)
└── src/
    ├── api/                    # ONLY files that call the server
    │   ├── client.js           # axios instance + interceptors (adds user_api_hash, handles logout)
    │   ├── endpoints.js        # every URL path as a constant, in one list
    │   ├── authApi.js          # login, logout, password reminder
    │   ├── vehiclesApi.js      # vehicles, vehicle-details, get_devices
    │   ├── historyApi.js       # get_history
    │   ├── reportsApi.js       # distance reports, payment report
    │   ├── eventsApi.js        # events / notifications
    │   ├── plansApi.js         # device-plans, payment start
    │   ├── profileApi.js       # profile show/update, change password
    │   └── settingsApi.js      # app/status, sliders, fcm_token
    │
    ├── socket/
    │   └── socketClient.js     # connect / join room / listen / disconnect (one file, well commented)
    │
    ├── store/
    │   ├── index.js            # configureStore + all reducers
    │   └── slices/
    │       ├── authSlice.js
    │       ├── vehiclesSlice.js    # vehicles + their live positions (socket updates land here)
    │       ├── historySlice.js
    │       ├── reportsSlice.js
    │       ├── eventsSlice.js
    │       ├── plansSlice.js
    │       ├── profileSlice.js
    │       └── appSlice.js         # app status, sliders, socket connection status
    │
    ├── routes/                 # ONLY navigation
    │   ├── RootNavigator.js    # shows AuthStack or MainTabs based on auth state
    │   ├── AuthStack.js
    │   ├── MainTabs.js         # bottom tabs: Home, Map, Vehicles, Reports, Account
    │   ├── VehicleStack.js     # Vehicles list -> details -> history -> overspeed ...
    │   └── routeNames.js       # every route name as a constant (no string typos)
    │
    ├── pages/                  # ONE folder per screen
    │   ├── Login/
    │   │   ├── LoginPage.js
    │   │   └── LoginPage.styles.js
    │   ├── Dashboard/
    │   │   ├── DashboardPage.js
    │   │   ├── DashboardSkeleton.js
    │   │   └── components/     # pieces used ONLY by this page
    │   ├── LiveMap/
    │   ├── Vehicles/
    │   ├── VehicleDetails/
    │   ├── History/
    │   ├── Reports/
    │   ├── Payments/
    │   ├── Notifications/
    │   └── Profile/
    │
    ├── components/             # reusable UI used by 2+ pages
    │   ├── common/             # AppButton, AppText, AppInput, Card, ScreenHeader, EmptyState, ErrorState
    │   ├── skeleton/           # Skeleton (base block), SkeletonCard, SkeletonList
    │   ├── vehicle/            # VehicleCard, StatusBadge, SpeedText, VehicleMarker
    │   └── map/                # MapView wrapper, MapControls
    │
    ├── hooks/                  # small reusable hooks (useVehicles, useVehicle, useSocketConnection)
    ├── theme/                  # colors.js, spacing.js, typography.js, index.js
    ├── utils/                  # formatDate.js, formatSpeed.js, vehicleStatus.js, md5Room.js
    ├── config/
    │   └── env.js              # reads API_BASE_URL / SOCKET_URL
    └── assets/                 # images, marker icons, fonts
```

**Where does my code go?**
- Calls the server? → `src/api/`
- Shared data many pages need? → a slice in `src/store/slices/`
- A screen? → `src/pages/<Name>/<Name>Page.js`
- UI used by two or more pages? → `src/components/`
- UI used by one page only? → `src/pages/<Name>/components/`
- A pure helper (formatting, calculations)? → `src/utils/`

### Naming
- Components & pages: `PascalCase.js` (`VehicleCard.js`, `LoginPage.js`).
- Pages end with `Page`, skeletons end with `Skeleton`.
- Slices: `camelCaseSlice.js`; API files: `camelCaseApi.js`; hooks start with `use`.
- Thunks: `fetchSomething`, `updateSomething`. Selectors: `selectSomething`.
- Boolean names start with `is`/`has` (`isOnline`, `hasExpired`).

---

## 4. Theme (brand colors)

| Token | Hex | Use for |
|---|---|---|
| `primary` | `#ff4f01` (orange) | main buttons, links, header icons, active tab/menu |
| `secondary` | `#ee193d` (red) | CTA buttons (e.g. "Renew now" / "Pay"), alerts, highlights |
| `accent` | `#ec9606` (amber) | idle/suspended status, counters, small accents, warnings |

Colors follow the approved design (https://claude.ai/artifact/GbbU9zLVLhoHZx3H7oZo5e).

**Light / dark mode:** `src/theme/colors.js` has two palettes, `lightColors` and `darkColors` (same token
names). `ThemeProvider` (in `App.js`) keeps the chosen mode (saved in AsyncStorage, defaults to the phone's
setting); the sun/moon button in the Home header switches it. **Components never import colors directly.** They read them with the hook:

```js
const { colors, isDark, toggleTheme } = useAppTheme();                 // inline colors
const styles = useThemedStyles(makeStyles);                            // makeStyles = (colors) => StyleSheet.create({...})
```
Style files export a function: `export default (colors) => StyleSheet.create({ ... })`. Use `colors.textOnPrimary`
(white in both modes) for text/icons on solid colors, never `colors.surface`. Plain helpers that need a color take
`colors` as a parameter (e.g. `getStatusColor(status, colors)`).

**Single source of truth:** all colors are in `src/theme/colors.js`. The three brand colors are
the `BRAND_PRIMARY`, `BRAND_SECONDARY`, `BRAND_ACCENT` constants at the top of that file — change
them there and the whole app re-colors. Status colors reuse those constants. Never write a hex
code anywhere else. Need a new color? Add a named token to `colors.js`.

Theme files (all exported from `src/theme/index.js`):
`colors.js`, `spacing.js` (`spacing` xs 4 … xxl 32, and `radius` sm 6 … round 999),
`typography.js` (`typography` title/subtitle/body/caption, and `fonts` for Plus Jakarta Sans).

**UI style:** clean white cards on a light gray background, rounded corners (`radius.md`),
soft shadow, white header with the logo and primary-colored icons, bottom tab bar with primary
active icon. Status cards use a light tint, a colored border and a thicker bottom border.
Red is for action/urgency only — do not make large red areas.

---

## 5. Backend facts (from the MotoTrack web repo)

- Base URL: `https://mototrack24.com/api` (put it in `.env`, never hard-code).
- Auth: `POST /api/login` with `email` (or phone number) + `password` → returns `user_api_hash`.
  Every other request must send `user_api_hash`:
  - GET requests → as a query param (`?user_api_hash=...`)
  - POST requests → in the body
  The axios interceptor in `client.js` adds it automatically. Pages never add it by hand.
- Responses are JSON with `status: 1` (ok) or `status: 0` (failed) for the classic GPSWox endpoints.
  HTTP 401/403 or an "unauthorized" message → clear the hash and go to Login.
- Full docs of classic endpoints: `API_DOCUMENTATION.md` in the web repo.
  Custom MotoTrack endpoints are NOT in that file — read their controllers in
  `app/Http/Controllers/Api/V1/` (web repo) to learn the exact params and response shape.
  **Never guess a response shape.** If unsure, log one real response and write it as a JSDoc comment
  at the top of the matching `src/api/*Api.js` function.

### Endpoints the customer app uses

| Feature | Method + path |
|---|---|
| Login | `POST /login` |
| Forgot password | `GET /password_reminder`, `POST /password_reminder` |
| User data / plan | `POST /get_user_data` |
| Profile | `GET /profile`, `PUT /profile` (photo, name), `POST /change_password` |
| Vehicles list | `GET /vehicles` (custom) — fall back to `POST /get_devices` only if needed |
| Vehicle details | `GET /vehicle-details` |
| Warranty | `GET /warranty-check` |
| History / playback | `POST /get_history` |
| Events | `POST /get_events` |
| Notifications | `GET /notifications` |
| Overspeed limit | `GET/PUT/DELETE /devices/{id}/overspeed` |
| Vehicle geofence | `GET/POST/DELETE /vehicle-geofences` |
| Distance reports | `GET /reports/distance-report/{monthly,daily,hourly,location,speed,trip,lastlocation,activity,movement-summary,engine/report}` |
| Payment report | `GET /reports/payment-report` |
| Fuel report | `GET /reports/fuel-report` |
| Device plans (renew) | `GET /device-plans` |
| App status / version | `GET /app/status` |
| Home sliders | `GET /sliders` |
| Push token | `POST /fcm_token` |
| Address lookup | `GET /geo_address` |

Put every path in `src/api/endpoints.js`. Example:

```js
// Every server path in one place. If the backend changes a URL, change it only here.
const endpoints = {
  login: '/login',
  userData: '/get_user_data',
  profile: '/profile',
  vehicles: '/vehicles',
  vehicleDetails: '/vehicle-details',
  history: '/get_history',
  // ...
};
export default endpoints;
```

### Payments (DGePay)
Renewals are paid with **DGePay** (the backend's gateway). The app shows plans from `/device-plans`,
starts the payment through the backend, opens the DGePay page, and after returning
**re-fetches the vehicle** to read the new expiry date. The app must **never** mark a payment as
successful by itself or send the price it calculated — the server decides. Confirm the exact
payment-start flow with the user before building this page.

---

## 6. Real-time tracking (Socket.IO)

How the web panel does it (copy this behavior exactly):

1. Server: `socket/socket.js` (socket.io **2.1**) listens on port 9002 behind nginx. It subscribes
   to Redis and forwards each message to the room named by the Redis channel.
2. Client connects, then emits **`join`** with the user's room: **`md5('user_' + userId)`**.
3. The server pushes these events to that room:
   - **`position`** → live position of one vehicle (from `App\Events\DevicePositionBroadcast`):
     ```json
     {"id":4,"lat":24.4753,"lng":90.0601,"speed":26,"course":321,"online":"online","timestamp":1790493116}
     ```
     `id` = MotoTrack device id (same as the vehicle id from the API), `course` = heading in degrees,
     `online` = status string, `timestamp` = unix seconds (UTC).
   - **`notice`** → `{ type: 'success'|'info'|'warning'|'error', message }` → show a toast.
4. On reconnect, emit `join` again (the web does this inside the `connect` handler).

Notes:
- ⚠️ **Backend issue:** the socket `position.timestamp` is 6 hours behind real time (checked 2026-10-07: an event
  that had just happened was 21,597 s old). The server seems to send Bangladesh clock time as if it were UTC.
  The app therefore stamps a live position with its arrival time. Backend fix wanted: send a true unix
  timestamp (UTC) in `DevicePositionBroadcast`, like `last_position_stamp` in `GET /vehicles`.
- `SOCKET_URL` goes in `.env` (production is the portal domain; the web uses the same origin,
  so the path is the default `/socket.io/`). Use `transports: ['websocket']`.
- We need the **numeric user id** to build the room. Get it from `/profile` or `/get_user_data`.
  If neither returns `id`, stop and ask the user to add it to the backend response — do not invent one.

### The flow (one direction only)

```
socket 'position' event
   → socketClient.js calls  dispatch(vehiclePositionReceived(payload))
   → vehiclesSlice updates that one vehicle
   → every page using useSelector(selectVehicleById(id)) re-renders with the new data
```

- Pages **never** listen to the socket directly. Only `src/socket/socketClient.js` does.
- Connect the socket **after login succeeds** (and on app start if a saved hash exists).
  Disconnect on logout and when the app goes to background for long; reconnect on foreground,
  then re-fetch vehicles once to catch anything missed.
- Store the connection state in `appSlice.socketStatus` (`'connected' | 'connecting' | 'disconnected'`)
  so the UI can show a small "Live" / "Reconnecting…" indicator.
- If a `position` arrives for a vehicle id we don't have, ignore it (or trigger one vehicles re-fetch).
- If many vehicles move at once and the UI lags, buffer positions for ~1 second and dispatch one
  `vehiclePositionsReceived([...])` action. Do this only if needed.

Skeleton of `socketClient.js`:

```js
import io from 'socket.io-client'; // v2!
import md5 from 'js-md5';
import { SOCKET_URL } from '../config/env';
import { vehiclePositionReceived } from '../store/slices/vehiclesSlice';
import { setSocketStatus } from '../store/slices/appSlice';

let socket = null;

/** Connect and join this user's room. Call once after login. */
export function connectSocket(userId, dispatch) {
  if (socket) return; // already connected

  const room = md5('user_' + userId); // same room name the web panel uses
  socket = io(SOCKET_URL, { transports: ['websocket'] });
  dispatch(setSocketStatus('connecting'));

  socket.on('connect', () => {
    socket.emit('join', room); // must re-join after every reconnect
    dispatch(setSocketStatus('connected'));
  });

  socket.on('disconnect', () => dispatch(setSocketStatus('disconnected')));

  // One vehicle moved -> update it in Redux. All pages update automatically.
  socket.on('position', (data) => dispatch(vehiclePositionReceived(data)));
}

export function disconnectSocket() {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
}
```

---

## 7. State management rules (Redux Toolkit)

- Use `createSlice` + `createAsyncThunk`. No RTK Query, no Saga, no Thunk factories.
- Each slice keeps the same simple shape so every developer knows what to expect:

```js
const initialState = {
  items: {},          // objects by id  -> { 4: {...}, 7: {...} }
  ids: [],            // order for lists
  status: 'idle',     // 'idle' | 'loading' | 'succeeded' | 'failed'
  error: null,
  lastFetchedAt: null // ms timestamp, used to decide if data is stale
};
```

  (`createEntityAdapter` is allowed for `vehiclesSlice` because socket updates are by id —
  if you use it, add a comment explaining what it does.)

- **Vehicles are the core data.** `vehiclesSlice` holds the vehicle list, details and live position.
  The Dashboard, Live Map, Vehicle list, Vehicle details and History all read from it.
  Don't create a second copy of vehicle data in another slice.
- Store raw values (numbers, ISO/unix times). Format for display only in components/utils.
- Put selectors at the bottom of the slice file: `selectAllVehicles`, `selectVehicleById(id)`,
  `selectVehicleCounts` (moving / idle / offline / expired), `selectVehiclesStatus`.
- Logout dispatches one `auth/logout` action; every slice resets to `initialState` on it
  (use `extraReducers` with `builder.addCase(logout, () => initialState)`).

### Fetch-once pattern (use in every thunk)

```js
const STALE_AFTER_MS = 60 * 1000; // re-fetch list if older than 1 minute

export const fetchVehicles = createAsyncThunk(
  'vehicles/fetchVehicles',
  async (_, { rejectWithValue }) => {
    try {
      return await vehiclesApi.getVehicles();
    } catch (error) {
      return rejectWithValue(error.message);
    }
  },
  {
    // Skip the request if we already have fresh data or a request is running.
    condition: (options = {}, { getState }) => {
      const { status, lastFetchedAt } = getState().vehicles;
      if (options.force) return true;                    // pull-to-refresh
      if (status === 'loading') return false;
      const isFresh = lastFetchedAt && Date.now() - lastFetchedAt < STALE_AFTER_MS;
      return !isFresh;
    },
  },
);
```

Pages call it in `useEffect` and on pull-to-refresh with `{ force: true }`.
Wrap common reads in small hooks, e.g. `useVehicles()` returns `{ vehicles, isLoading, error, refresh }`.

---

## 8. API layer rules

- `src/api/client.js` is the only file that creates axios. It:
  - sets `baseURL` from env and a timeout (15s),
  - adds `user_api_hash` to every request (query for GET, body for POST/PUT),
  - converts errors to a plain `Error` with a human message (`"No internet connection"`,
    `"Session expired, please log in again"`, server message, …),
  - on 401/403 dispatches logout (pass the store in once via `setupInterceptors(store)`).
- Each `*Api.js` file exports small async functions that return **only the data** (`response.data`),
  never the axios response. One function = one endpoint.
- No UI code, no Redux code, no `Alert` inside `src/api/`.

```js
// src/api/vehiclesApi.js
import client from './client';
import endpoints from './endpoints';

/**
 * Get all vehicles of the logged-in customer.
 * Response example: { status: 1, data: [ { id, name, plate_number, ... } ] }  <- paste a real one
 */
export async function getVehicles() {
  const response = await client.get(endpoints.vehicles);
  return response.data;
}
```

---

## 9. Pages, loading and skeletons

Every page that loads data follows the same 4 states, in this order:

```js
if (isLoading && vehicles.length === 0) return <VehiclesSkeleton />;   // first load
if (error && vehicles.length === 0) return <ErrorState message={error} onRetry={refresh} />;
if (vehicles.length === 0) return <EmptyState text="No vehicles yet" />;
return <FlatList ... refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />} />;
```

- When data already exists and we are refreshing, keep showing the data (no skeleton flash).
- Build skeletons from `src/components/skeleton/Skeleton.js` — a gray block with a soft
  pulse animation using RN `Animated` (no extra library). Each page has its own
  `<Name>Skeleton.js` that matches the real layout (same card sizes, same rows).
- Buttons that submit show a small spinner **inside the button** and are disabled while sending.
- Errors are shown in friendly words. Never show raw stack traces or JSON to users.
- **Validation messages, server errors and alerts are shown as toasts**, not inline text or `Alert.alert`:
  `dispatch(showToast({ type: 'success' | 'info' | 'warning' | 'error', message }))` from
  `src/store/slices/toastSlice.js`. One `ToastHost` in `App.js` draws it at the top, colored by type
  (colors from `colors.success / info / warning / error`). Socket `notice` events and (later) FCM
  foreground pushes dispatch the same action. Validation problems use `warning`, server failures `error`.

### Page template

```js
// src/pages/Vehicles/VehiclesPage.js
// Shows the customer's vehicles with live status. Data comes from Redux (shared with the map).
import React, { useEffect } from 'react';
import { FlatList, RefreshControl } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import { fetchVehicles, selectAllVehicles } from '../../store/slices/vehiclesSlice';
import VehicleCard from '../../components/vehicle/VehicleCard';
import VehiclesSkeleton from './VehiclesSkeleton';
import ErrorState from '../../components/common/ErrorState';
import EmptyState from '../../components/common/EmptyState';
import styles from './VehiclesPage.styles';

export default function VehiclesPage({ navigation }) {
  const dispatch = useDispatch();
  const vehicles = useSelector(selectAllVehicles);
  const { status, error } = useSelector((state) => state.vehicles);
  const isLoading = status === 'loading';

  // Loads only if not loaded yet or stale (see condition in the thunk)
  useEffect(() => {
    dispatch(fetchVehicles());
  }, [dispatch]);

  const refresh = () => dispatch(fetchVehicles({ force: true }));

  if (isLoading && vehicles.length === 0) return <VehiclesSkeleton />;
  if (error && vehicles.length === 0) return <ErrorState message={error} onRetry={refresh} />;
  if (vehicles.length === 0) return <EmptyState text="No vehicles found" />;

  return (
    <FlatList
      style={styles.list}
      data={vehicles}
      keyExtractor={(item) => String(item.id)}
      renderItem={({ item }) => (
        <VehicleCard vehicle={item} onPress={() => navigation.navigate('VehicleDetails', { id: item.id })} />
      )}
      refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refresh} />}
    />
  );
}
```

Pass only the **id** in navigation params; the next page reads the vehicle from Redux by id
(so it stays live). Never pass whole objects through navigation.

---

## 10. Screens for v1 (customer)

| Tab / Screen | What it shows |
|---|---|
| **Login** | Email or phone + password, "Forgot password", saves hash in Keychain |
| **Home (Dashboard)** | Greeting, sliders, counts: total / moving / idle / offline / expiring soon, list of vehicles expiring soon with "Renew" (red CTA) |
| **Live Map** | All vehicles as rotated markers (by `course`), colored by status, status filter chips, tap marker → bottom card (name, plate, speed, last update, address, buttons: Details, History). "Live" indicator from `socketStatus`. Follow-vehicle mode on details. |
| **Vehicles** | Search by name/plate, status filter, `VehicleCard` list |
| **Vehicle details** | Small live map, speed, status, ignition, last update (BD time), address, expiry date + days left, warranty, actions: History, Reports, Overspeed limit, Geofence, Renew |
| **History** | Date range picker (Today / Yesterday / Custom), route polyline, start/stop markers, playback with speed control, trip summary |
| **Reports** | Pick vehicle + report type (monthly, daily, hourly, trip, speed, activity, movement summary, location, engine) + dates → summary cards + list |
| **Payments** | Plans for a vehicle, renew with DGePay, payment history (payment-report) |
| **Notifications** | Events/alerts list, newest first, tap → vehicle on map at that point |
| **Account (Profile)** | Photo, name, phone, email, change password, app version, logout |

**Google Maps key (required for any map):** the key is NOT in committed files. Put `GOOGLE_MAPS_API_KEY=your_key`
in the project's `.env` file (git-ignored; `.env.example` shows the format), then rebuild the app
(`cd android && ./gradlew app:installDebug`). `app/build.gradle` reads `.env` and passes the key to the manifest.
It is a native setting, so a change needs a rebuild (a Metro reload is not enough). Fallbacks: `android/local.properties`, then the environment variable. Without it the map is blank
(log says `API Key: MISSING_GOOGLE_MAPS_KEY`). The key needs "Maps SDK for Android" enabled in Google Cloud.

**Vehicle details page** (`pages/VehicleDetails`): opens from a vehicle row with `{ id }` only. The live map
(`components/map/VehicleMap.js`) glides the marker between socket positions (never jumps), rotates it by `course`,
colors it by status (`getStatusColor`) and follows it until the user pans (the crosshair button follows again).
`GET /vehicle-details` is stored on the vehicle itself (`vehicle.details`) and survives list refreshes; the rows
come from `utils/vehicleSections.js`. **Never show the device IMEI or protocol anywhere in the app.**
The page has no Sensors or Geofences & services cards.

Map rules: `tracksViewChanges={false}` on markers (performance), cluster or limit markers if
> 200 vehicles, keep the user's zoom when positions update (don't re-center on every update
unless "follow" mode is on).

---

## 11. Coding style (beginner-friendly)

- Function components + hooks only. No class components.
- Default export for components/pages; named exports for thunks, actions, selectors, utils.
- Styles: `StyleSheet.create` in `<Name>.styles.js` next to the page (or bottom of small components).
  No inline style objects except a single dynamic value (e.g. `{ backgroundColor: statusColor }`).
- Each file starts with a 1–2 line comment saying what it does.
- Comment the **why**, not the obvious what. Keep comments short and in plain English.
- Early returns instead of nested `if`/ternaries. No nested ternaries at all.
- Descriptive names: `selectedVehicleId`, not `sv` or `data2`.
- `async/await` with `try/catch`; never `.then()` chains.
- Use `useCallback`/`useMemo` only for list `renderItem`, map markers and expensive filters — not everywhere.
- Keep business rules in `src/utils/` as pure functions (e.g. `getVehicleStatus(vehicle)`,
  `getDaysLeft(expiryDate)`), and write a Jest test for each.
- No `console.log` left in committed code (use `__DEV__ && console.log(...)` while debugging, then remove).
- Strings shown to users are in English for v1; keep them in the component (no i18n library yet),
  but don't build text by gluing many pieces — it makes translation hard later.

### Date & time
All display goes through `src/utils/formatDate.js`:

```js
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import timezone from 'dayjs/plugin/timezone';
dayjs.extend(utc);
dayjs.extend(timezone);

const BD_TZ = 'Asia/Dhaka';

/** Format a unix timestamp (seconds) or date string as Bangladesh time. */
export function formatBdDateTime(value) {
  if (!value) return '-';
  const date = typeof value === 'number' ? dayjs.unix(value) : dayjs.utc(value);
  return date.tz(BD_TZ).format('DD MMM YYYY, hh:mm A');
}
```

---

## 12. Security

- `user_api_hash` only in Keychain — never in AsyncStorage, Redux persist, logs or crash reports.
- No secrets in the repo. `.env` is git-ignored; keep `.env.example` updated.
- Google Maps Android key goes in `android/app/src/main/AndroidManifest.xml` via a gradle
  placeholder read from env — not hard-coded in JS.
- Use HTTPS URLs only.
- Never trust the app for money: prices, payment success and expiry dates always come from the server.

---

## 13. Commands

```bash
npm install
npm install react-native-paper    # UI component library (already in package.json after npm install)
npx react-native start            # Metro
npx react-native run-android
npm run lint                      # ESLint
npm test                          # Jest
cd android && ./gradlew assembleRelease   # release APK
```

Project was created with `npx @react-native-community/cli init MotoTrack24`.
The template is TypeScript by default — convert to JavaScript (rename `App.tsx` → `App.js`,
remove `tsconfig.json` and TS-only deps) as the very first step.

---

## 14. Definition of done (check before saying a task is finished)

- [ ] Code is in the right folder (api / store / routes / pages / components).
- [ ] Server data is read from Redux; no duplicated server data in `useState`.
- [ ] Page has skeleton, error state (with Retry), empty state and pull-to-refresh.
- [ ] Opening the page a second time does not refetch fresh data.
- [ ] Live vehicles update from the socket on every page that shows them.
- [ ] Only theme tokens used for colors/spacing/fonts.
- [ ] Times shown in Bangladesh time.
- [ ] `npm run lint` and `npm test` pass; app runs on an Android device/emulator.
- [ ] No unrelated files changed. New endpoint shapes documented with JSDoc in `src/api/`.
- [ ] If a backend change is needed, it is written up for the user, not hacked around in the app.
