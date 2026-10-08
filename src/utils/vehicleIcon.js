// Which picture a vehicle uses, and how to draw it. The server sends it with each vehicle:
// icon_url (picture), icon_type ('rotating' | 'arrow' | other = does not turn), icon_width, icon_height.
// The same picture is used everywhere: lists, the details page and the map marker.

/** Link of the vehicle's picture, or null when it has none (the app then draws a plain car icon). */
export function getVehicleIconUrl(vehicle) {
  return vehicle?.icon_url || vehicle?.details?.icon_url || null;
}

/** Rotating and arrow pictures turn to face the way the vehicle is heading; other pictures stay as they are. */
export function shouldRotateIcon(vehicle) {
  const iconType = vehicle?.icon_type || vehicle?.details?.icon_type;
  return iconType === 'rotating' || iconType === 'arrow';
}

/**
 * Size to draw the picture at: the given height, with the width following the picture's own shape.
 * @param {object} vehicle Vehicle with icon_width / icon_height
 * @param {number} height Wanted height
 */
export function getVehicleIconSize(vehicle, height) {
  const iconWidth = Number(vehicle?.icon_width || vehicle?.details?.icon_width);
  const iconHeight = Number(vehicle?.icon_height || vehicle?.details?.icon_height);
  const hasShape = iconWidth > 0 && iconHeight > 0;
  return { width: hasShape ? Math.round((height * iconWidth) / iconHeight) : height, height };
}
