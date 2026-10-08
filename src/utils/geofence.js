// Helpers for drawing a geofence on the map and sending it to the server.

export const MIN_GEOFENCE_POINTS = 3;

/**
 * Body for POST /add_geofence (shape from the Postman collection "Set Geofence data").
 * @param {string} name Geofence name typed by the user
 * @param {Array<{latitude: number, longitude: number}>} points Corners drawn on the map
 * @param {string} color Hex color of the zone
 */
export function buildGeofencePayload(name, points, color) {
  return {
    name: name.trim(),
    type: 'polygon',
    polygon_color: color,
    polygon: points.map((point) => ({ lat: point.latitude, lng: point.longitude })),
  };
}
