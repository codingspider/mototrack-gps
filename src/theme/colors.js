// ALL app colors live here: one light palette and one dark palette.
// To re-brand the whole app, change the BRAND block below. Components never write hex codes:
// they read colors with the useAppTheme() hook from '../theme'.

// ---- BRAND: change these 3 lines to change the look of the whole app (light AND dark) ----
const BRAND_PRIMARY = '#ff4f01'; // orange: buttons, links, header icons, active tab
const BRAND_SECONDARY = '#ee193d'; // red: Renew / Pay CTA, alerts
const BRAND_ACCENT = '#ec9606'; // amber: idle status, warnings, small accents
// ------------------------------------------------------------------------------------------

export const lightColors = {
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

  // Toast / message colors (one per type)
  success: '#16a34a',
  info: '#0b4ca3',
  warning: BRAND_ACCENT,
  error: BRAND_SECONDARY,

  // Login header city scene (illustration colors)
  sceneGround: '#f8fafc',
  sceneGroundShade: '#e3e9f1',
  sceneRoad: '#cdd5df',
  sceneRoadEdge: '#b9c3cf',
  sceneBuildingTop: '#ffffff',
  sceneBuildingLeft: '#e3e9f1',
  sceneBuildingRight: '#f4f7fb',
  sceneWindow: '#2563a8',
  sceneTreeDark: '#2f7d3a',
  sceneTreeMid: '#43a047',
  sceneTreeLight: '#7bc86c',
  sceneTrunk: '#8d6e4a',
  sceneCarShade: '#b3122f',

  // Neutrals
  background: '#f4f6fa',
  surface: '#ffffff',
  border: '#e5e7eb',
  text: '#111827',
  textSecondary: '#6b7280',
  textMuted: '#9ca3af',
  textOnPrimary: '#ffffff', // text/icons on primary, secondary and other solid colors (white in both modes)
  skeleton: '#e5e7eb',
  skeletonHighlight: '#f3f4f6',
  shadow: '#111827',
};

// Dark mode: same names, darker values. Brand colors stay the same so the app keeps its identity.
export const darkColors = {
  ...lightColors,

  primaryLight: '#2a1a12',
  primarySoft: '#3a2217',
  primaryBorder: '#5c3520',
  primaryInputBg: '#1f2630',
  primaryInputBorder: '#5c3520',

  secondaryLight: '#2c1519',
  secondarySoft: '#3f1b22',
  secondaryBorder: '#6a2631',

  accentLight: '#2b2110',
  accentSoft: '#3d2e12',
  accentBorder: '#6b5018',

  statusOnline: '#4ade80',
  statusOnlineLight: '#12251a',
  statusOnlineSoft: '#173824',
  statusOnlineBorder: '#2c6a43',
  statusMoving: '#22c55e',
  statusOffline: '#9ca3af',
  statusOfflineLight: '#1e242d',
  statusOfflineSoft: '#2a323d',
  statusOfflineBorder: '#475262',

  success: '#22c55e',
  info: '#3b82f6',

  // The city at night: dark ground and buildings, glowing windows
  sceneGround: '#1c2531',
  sceneGroundShade: '#141b24',
  sceneRoad: '#384251',
  sceneRoadEdge: '#2b3340',
  sceneBuildingTop: '#4d5a6d',
  sceneBuildingLeft: '#2e3949',
  sceneBuildingRight: '#3c485a',
  sceneWindow: '#fbbf24',
  sceneTreeDark: '#1f5a2a',
  sceneTreeMid: '#2e7d32',
  sceneTreeLight: '#4c9f50',
  sceneTrunk: '#6b5436',

  background: '#0e131a',
  surface: '#19202a',
  border: '#2a3340',
  text: '#f3f4f6',
  textSecondary: '#9aa4b2',
  textMuted: '#6b7280',
  skeleton: '#2a3340',
  skeletonHighlight: '#323c4a',
  shadow: '#000000',
};

// Fallback for plain (non-React) code. Screens use useAppTheme() so they follow the chosen mode.
export default lightColors;
