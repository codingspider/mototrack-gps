// The actions on the vehicle details page (one scrolling row) and the text for the Share action.
import { formatBdDateTime } from './formatDate';

// Order of the row. Playback comes first. Driving is not shown. `isReady: false` actions only show "coming soon".
export const VEHICLE_ACTIONS = [
  { key: 'playback', label: 'Playback', icon: 'play-circle-outline' },
  { key: 'reports', label: 'Reports', icon: 'chart-bar' },
  { key: 'overspeed', label: 'Overspeed', icon: 'speedometer' },
  { key: 'geofence', label: 'Geofence', icon: 'dots-circle' },
  { key: 'engine', label: 'Engine', icon: 'power' },
  { key: 'fuel', label: 'Fuel', icon: 'gas-station-outline' },
  { key: 'routeAnalytics', label: 'Route analytics', icon: 'chart-timeline-variant' },
  { key: 'routeFinder', label: 'Route finder', icon: 'map-search-outline' },
  { key: 'alarm', label: 'Alarm', icon: 'bell-ring-outline' },
  { key: 'share', label: 'Share', icon: 'share-variant-outline' },
  { key: 'payments', label: 'Recharge Now', icon: 'credit-card-outline' },
];

/** The choices (in hours) for how long a live share link works. */
export const SHARE_HOURS = [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12];

/**
 * The message sent from the Share action: the vehicle, the live link and when the link stops working.
 * @param {object} vehicle Vehicle from Redux
 * @param {string} url The live link from the server
 * @param {number} expiresAt Unix seconds (UTC) when the link stops working
 */
export function buildShareLinkMessage(vehicle, url, expiresAt) {
  const plate = vehicle.plate_number ? ` (${vehicle.plate_number})` : '';
  return [
    `Track ${vehicle.device_name}${plate} live`,
    `Link works until ${formatBdDateTime(expiresAt)}`,
    url,
  ].join('\n');
}
