// Search and status filter shared by the Vehicles list and the Live map.
import { getStatusGroup } from './vehicleStatus';

// Same words as the Home tiles. "Expired" is the server's Suspended status.
export const STATUS_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'online', label: 'Online' }, // every vehicle that is not offline (same as the Home tile)
  { key: 'moving', label: 'Moving' },
  { key: 'idle', label: 'Stop' },
  { key: 'offline', label: 'Offline' },
  { key: 'suspended', label: 'Expired' },
];

/** True when the vehicle belongs to the filter. 'online' = anything that is not offline. */
function matchesFilter(vehicle, filterKey) {
  const group = getStatusGroup(vehicle.status);
  if (filterKey === 'all') {
    return true;
  }
  if (filterKey === 'online') {
    return group !== 'offline';
  }
  return group === filterKey;
}

/**
 * @param {object[]} vehicles Vehicles from Redux
 * @param {string} filterKey 'all' | 'online' | 'moving' | 'idle' | 'offline' | 'suspended'
 * @param {string} query Text typed in the search box (name or plate)
 * @returns {object[]}
 */
export function filterVehicles(vehicles, filterKey = 'all', query = '') {
  const text = query.trim().toLowerCase();
  return vehicles.filter((vehicle) => {
    if (!matchesFilter(vehicle, filterKey)) {
      return false;
    }
    if (!text) {
      return true;
    }
    return `${vehicle.device_name || ''} ${vehicle.plate_number || ''}`.toLowerCase().includes(text);
  });
}

/** How many vehicles are in each filter: { all, online, moving, idle, offline, suspended } */
export function countByFilter(vehicles) {
  const counts = { all: vehicles.length, online: 0, moving: 0, idle: 0, offline: 0, suspended: 0 };
  vehicles.forEach((vehicle) => {
    const group = getStatusGroup(vehicle.status);
    counts[group] += 1;
    if (group !== 'offline') {
      counts.online += 1;
    }
  });
  return counts;
}

/** The vehicle's position as numbers, or null when it has none yet (the server sends text or numbers). */
export function getVehicleCoordinate(vehicle) {
  const latitude = Number(vehicle?.lat);
  const longitude = Number(vehicle?.lng);
  const isValid = Number.isFinite(latitude) && Number.isFinite(longitude) && !(latitude === 0 && longitude === 0);
  return isValid && vehicle.lat !== null && vehicle.lat !== '' ? { latitude, longitude } : null;
}
