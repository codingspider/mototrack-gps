// Street View links. The interactive view is Google's Maps Embed API shown inside a web view.

const METADATA_BASE = 'https://maps.googleapis.com/maps/api/streetview/metadata';
const EMBED_BASE = 'https://www.google.com/maps/embed/v1/streetview';
const SEARCH_RADIUS_M = 300;
// The embedded page asks Google "is this site allowed to use the key?", so it gets a real web address
export const EMBED_BASE_URL = 'https://mototrack24.com';

/** Normalize a compass heading to 0..359. */
export function normalizeHeading(heading) {
  return ((Math.round(heading) % 360) + 360) % 360;
}

/**
 * Link that asks Google for the nearest street picture around a spot (answer has `status` and `pano_id`).
 * radius: look within this many meters (Google's default is only 50). source=outdoor: no indoor photos.
 */
export function getStreetViewMetadataUrl(latitude, longitude, key) {
  return `${METADATA_BASE}?location=${latitude},${longitude}&radius=${SEARCH_RADIUS_M}&source=outdoor&key=${key}`;
}

/**
 * Small web page that shows the interactive Street View at a panorama, looking toward `heading`.
 * The user can drag to look around and tap the arrows to move along the street.
 * @param {string} panoId Panorama id from the metadata answer
 * @param {number} heading Compass degrees (0 = north)
 * @param {string} key Google Maps key
 */
export function getStreetViewHtml(panoId, heading, key) {
  const src = `${EMBED_BASE}?key=${key}&pano=${encodeURIComponent(panoId)}&heading=${normalizeHeading(heading)}&pitch=0&fov=90`;
  return `<!DOCTYPE html><html><head><meta name="viewport" content="width=device-width, initial-scale=1">
<style>html,body{margin:0;height:100%;background:#000}iframe{border:0;width:100%;height:100%}</style></head>
<body><iframe allowfullscreen src="${src}"></iframe></body></html>`;
}

/** Link that opens the full Street View in the Google Maps app or site. */
export function getStreetViewAppUrl(latitude, longitude, heading) {
  return `https://www.google.com/maps/@?api=1&map_action=pano&viewpoint=${latitude},${longitude}&heading=${normalizeHeading(heading)}`;
}
