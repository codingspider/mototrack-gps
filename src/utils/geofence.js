// Helpers for geofences: reading the server's shape, drawing it on the map and sending it back.

export const MIN_GEOFENCE_POINTS = 3;

// Circle geofences: the sizes the − / + buttons step through (radius in meters), and the size a new circle starts at
export const CIRCLE_RADIUS_STEPS = [50, 100, 150, 200, 300, 500, 750, 1000, 1500, 2000, 3000, 5000, 10000];
export const DEFAULT_CIRCLE_RADIUS = 200;

/**
 * The next size up (direction 1) or down (-1) from any radius, even one that is not a step (a circle from the web).
 * Stays at the smallest / largest step at the ends.
 */
export function stepCircleRadius(current, direction) {
  const value = Number(current) || DEFAULT_CIRCLE_RADIUS;
  if (direction > 0) {
    const bigger = CIRCLE_RADIUS_STEPS.find((step) => step > value);
    return bigger || CIRCLE_RADIUS_STEPS[CIRCLE_RADIUS_STEPS.length - 1];
  }
  const smaller = [...CIRCLE_RADIUS_STEPS].reverse().find((step) => step < value);
  return smaller || CIRCLE_RADIUS_STEPS[0];
}

/** "200 m", "1.5 km", "10 km" */
export function formatRadius(meters) {
  const value = Math.round(Number(meters) || 0);
  if (value < 1000) {
    return `${value} m`;
  }
  const km = value / 1000;
  return `${Number.isInteger(km) ? km : km.toFixed(1)} km`;
}

/** The circle part of a create / edit body: { type: 'circle', center: { lat, lng }, radius } (meters). */
function circleFields(circle) {
  return {
    type: 'circle',
    center: { lat: circle.latitude, lng: circle.longitude },
    radius: Math.round(Number(circle.radius)),
  };
}

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
 * Body for POST /add_geofence (shape from the Postman collection "Set Geofence data"; a circle is
 * { type: 'circle', center: { lat, lng }, radius } as the server's GeofenceFormValidator expects).
 * @param {string} name Geofence name typed by the user
 * @param {Array<{latitude: number, longitude: number}>|null} points Corners drawn on the map (polygon)
 * @param {string} color Hex color of the zone (7 characters, the server requires it)
 * @param {{ latitude: number, longitude: number, radius: number }|null} circle A circle instead of corners
 */
export function buildGeofencePayload(name, points, color, circle = null) {
  if (circle) {
    return { name: name.trim(), polygon_color: color, ...circleFields(circle) };
  }
  return {
    name: name.trim(),
    type: 'polygon',
    polygon_color: color,
    polygon: points.map((point) => ({ lat: point.latitude, lng: point.longitude })),
  };
}

/**
 * Body for POST /edit_geofence. Pass `points` (polygon) or `circle` to change the shape, or neither to keep it.
 * @param {number} id Geofence id
 */
export function buildEditPayload(id, name, points, color, circle = null) {
  const payload = { id, name: name.trim(), polygon_color: color };
  if (circle) {
    return { ...payload, ...circleFields(circle) };
  }
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
