// ALL app colors live here. To re-brand the whole app, change the BRAND block below.
// Components must import from '../theme' and never write hex codes.

// ---- BRAND: change these 3 lines to change the look of the whole app ----
const BRAND_PRIMARY = '#ff4f01'; // orange: buttons, links, header icons, active tab
const BRAND_SECONDARY = '#ee193d'; // red: Renew / Pay CTA, alerts
const BRAND_ACCENT = '#ec9606'; // amber: idle status, warnings, small accents
// --------------------------------------------------------------------------

const colors = {
  primary: BRAND_PRIMARY,
  primaryDark: '#d94300', // pressed state
  primaryLight: '#fff4ee', // light backgrounds (selected rows, chips, activity cards)
  primarySoft: '#fff0e8', // icon circles, badges
  primaryBorder: '#ffd9c6', // borders on light primary surfaces
  primaryInputBg: '#fffaf7', // input background
  primaryInputBorder: '#ffd3bd',

  secondary: BRAND_SECONDARY,
  secondaryLight: '#fff5f7',
  secondarySoft: '#fde8ec',
  secondaryBorder: '#f9c0ca',

  accent: BRAND_ACCENT,
  accentLight: '#fff7ec',
  accentSoft: '#fde5c8',
  accentBorder: '#f5c58a',

  // Vehicle status colors (StatusBadge, Home status grid, map markers)
  statusOnline: '#15803d',
  statusOnlineLight: '#f1f9f3',
  statusOnlineSoft: '#d6eedd',
  statusOnlineBorder: '#9fd3ae',
  statusMoving: '#16a34a',
  statusIdle: BRAND_ACCENT,
  statusStop: BRAND_SECONDARY,
  statusSuspended: BRAND_ACCENT,
  statusOffline: '#4b5563',
  statusOfflineLight: '#f6f7f9',
  statusOfflineSoft: '#e5e7eb',
  statusOfflineBorder: '#b8bec8',
  statusAlert: BRAND_SECONDARY,

  // Neutrals
  background: '#f4f6fa',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff',
  skeleton: '#e5e7eb',
  skeletonHighlight: '#f3f4f6',
  shadow: '#111827',
};

export default colors;
