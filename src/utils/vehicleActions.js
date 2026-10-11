// The actions on the vehicle details page (one scrolling row) and the text for the Share action.
import { formatBdDateTime } from './formatDate';

// Order of the row. Playback comes first. Driving is not shown. `isReady: false` actions only show "coming soon".
export const VEHICLE_ACTIONS = [
  { key: 'playback', label: 'Playback', icon: 'play-circle-outline' },
  { key: 'history', label: 'History', icon: 'history' },
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

/**
 * The message shared from the Share action: the vehicle, where it is now and a Google Maps link.
 * @param {object} vehicle Vehicle from Redux
 * @returns {string|null} null when the vehicle has no position yet
 */
export function buildShareMessage(vehicle) {
  const latitude = Number(vehicle?.lat);
  const longitude = Number(vehicle?.lng);
  const hasPosition = vehicle && vehicle.lat !== null && vehicle.lat !== '' && Number.isFinite(latitude) && Number.isFinite(longitude);
  if (!hasPosition || (latitude === 0 && longitude === 0)) {
    return null;
  }
  const lines = [`${vehicle.device_name}${vehicle.plate_number ? ` (${vehicle.plate_number})` : ''}`];
  if (vehicle.address) {
    lines.push(vehicle.address);
  }
  if (vehicle.last_position_stamp) {
    lines.push(`Updated ${formatBdDateTime(vehicle.last_position_stamp)}`);
  }
  lines.push(`https://maps.google.com/?q=${latitude},${longitude}`);
  return lines.join('\n');
}
