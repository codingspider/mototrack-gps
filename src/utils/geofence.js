// Helpers for geofences: reading the server's shape, drawing it on the map and sending it back.

export const MIN_GEOFENCE_POINTS = 3;

// When the customer wants the alert: `zone` of POST /vehicle-geofences
export const GEOFENCE_ZONES = [
  { key: 'out', label: 'Leaves', hint: 'Alert when the vehicle leaves the area' },
  { key: 'in', label: 'Enters', hint: 'Alert when the vehicle enters the area' },
  { key: 'both', label: 'Both', hint: 'Alert when it enters or leaves the area' },
];

/** The words for a zone key ("Alert when it leaves"). */
export function getZoneText(zone) {
  const found = GEOFENCE_ZONES.find((item) => item.key === zone);
  return found ? found.hint : 'Alert when it enters or leaves';
}

/**
 * Body for POST /add_geofence (shape from the Postman collection "Set Geofence data").
 * @param {string} name Geofence name typed by the user
 * @param {Array<{latitude: number, longitude: number}>} points Corners drawn on the map
 * @param {string} color Hex color of the zone (7 characters, the server requires it)
 */
export function buildGeofencePayload(name, points, color) {
  return {
    name: name.trim(),
    type: 'polygon',
    polygon_color: color,
    polygon: points.map((point) => ({ lat: point.latitude, lng: point.longitude })),
  };
}

/**
 * Body for POST /edit_geofence. Pass `points` to change the shape, or null to keep it (circles keep theirs).
 * @param {number} id Geofence id
 */
export function buildEditPayload(id, name, points, color) {
  const payload = { id, name: name.trim(), polygon_color: color };
  if (points) {
    payload.type = 'polygon';
    payload.polygon = points.map((point) => ({ lat: point.latitude, lng: point.longitude }));
  }
  return payload;
}

/**
 * The corners of a polygon geofence as map points. The server keeps them as a JSON text
 * ('[{"lat":24.1,"lng":89.2}, ...]') in `coordinates`, but a list is accepted too.
 * @returns {Array<{latitude: number, longitude: number}>} Empty when there is no polygon
 */
export function parseCoordinates(value) {
  let list = value;
  if (typeof value === 'string') {
    try {
      list = JSON.parse(value);
    } catch (error) {
      return [];
    }
  }
  if (!Array.isArray(list)) {
    return [];
  }
  return list
    .map((point) => ({ latitude: Number(point.lat), longitude: Number(point.lng) }))
    .filter((point) => Number.isFinite(point.latitude) && Number.isFinite(point.longitude));
}

/** A circle geofence as { latitude, longitude, radius (meters) }, or null. */
export function getCircle(geofence) {
  const center = geofence?.center;
  const latitude = Number(center?.lat);
  const longitude = Number(center?.lng);
  const radiusMeters = Number(geofence?.radius);
  if (geofence?.type !== 'circle' || !Number.isFinite(latitude) || !Number.isFinite(longitude) || !(radiusMeters > 0)) {
    return null;
  }
  return { latitude, longitude, radius: radiusMeters };
}

/** The middle of a list of points (for centering the map on a geofence), or null. */
export function getCenter(points) {
  if (!points || points.length === 0) {
    return null;
  }
  const sum = points.reduce(
    (total, point) => ({ latitude: total.latitude + point.latitude, longitude: total.longitude + point.longitude }),
    { latitude: 0, longitude: 0 },
  );
  return { latitude: sum.latitude / points.length, longitude: sum.longitude / points.length };
}

/**
 * Join a vehicle's links (GET /vehicle-geofences) with the geofences (GET /get_geofences) for the list screen.
 * A link whose geofence is not loaded yet still shows, using the name the link carries.
 * @param {object[]} links [{ alert_id, zone, active, geofence_id, geofence_name, type, polygon_color }]
 * @param {object} geofencesById { [id]: geofence }
 */
export function joinVehicleGeofences(links, geofencesById) {
  return (links || []).map((link) => {
    const geofence = geofencesById[link.geofence_id];
    return {
      id: link.geofence_id,
      name: (geofence && geofence.name) || link.geofence_name,
      type: (geofence && geofence.type) || link.type || 'polygon',
      color: (geofence && geofence.polygon_color) || link.polygon_color,
      zone: link.zone,
      isActive: !!link.active,
      geofence: geofence || null,
    };
  });
}
