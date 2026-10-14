// Distance texts for a vehicle row: how far it went today and in total.
// They come from GET /vehicle-details (vehicle.details), or from the list item itself if the server adds them.

/** "12.4 km" from a number or numeric text, or null when there is no value. */
function formatKm(value) {
  if (value === null || value === undefined || value === '') {
    return null;
  }
  const number = Number(value);
  if (!Number.isFinite(number)) {
    return null;
  }
  const text = number >= 1000 ? Math.round(number).toLocaleString('en-US') : number.toFixed(1);
  return `${text} km`;
}

/**
 * @param {object} vehicle Vehicle from Redux
 * @returns {{ today: string|null, total: string|null }} null = not known yet (details not loaded)
 */
export function getTravelSummary(vehicle) {
  const details = (vehicle && vehicle.details) || {};
  const todayValue = vehicle && vehicle.today_travel !== undefined ? vehicle.today_travel : details.today_travel;
  const totalValue = vehicle && vehicle.total_distance !== undefined ? vehicle.total_distance : details.total_distance;
  return { today: formatKm(todayValue), total: formatKm(totalValue) };
}

/**
 * The same two distances as numbers (km), for the speedometer page.
 * @param {object} vehicle Vehicle from Redux
 * @returns {{ todayKm: number|null, totalKm: number|null }} null = not known yet (details not loaded)
 */
export function getTravelNumbers(vehicle) {
  const details = (vehicle && vehicle.details) || {};
  const todayValue = vehicle && vehicle.today_travel !== undefined ? vehicle.today_travel : details.today_travel;
  const totalValue = vehicle && vehicle.total_distance !== undefined ? vehicle.total_distance : details.total_distance;
  const toKm = (value) => {
    if (value === null || value === undefined || value === '') {
      return null;
    }
    const number = Number(value);
    return Number.isFinite(number) ? number : null;
  };
  return { todayKm: toKm(todayValue), totalKm: toKm(totalValue) };
}
