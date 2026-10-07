// Turns one vehicle (list data + the /vehicle-details data) into labelled rows for the details page.
// Pure function, no UI. Rows with no value are hidden unless they are marked alwaysShow.
// Never show the device IMEI or protocol in the app. The expiry date has its own card (ServiceExpiryCard).
import { formatBdDateTime, formatTimeAgo } from './formatDate';

const EMPTY = '-';

const isEmpty = (value) => value === null || value === undefined || value === '';

const row = (label, value, alwaysShow = false) => ({ label, value: isEmpty(value) ? EMPTY : String(value), alwaysShow });

const withUnit = (value, unit) => (isEmpty(value) ? null : `${value} ${unit}`);

const onOff = (value) => (value ? 'On' : 'Off');

/**
 * @param {object} vehicle Vehicle from Redux (live fields) with optional `details` from /vehicle-details
 * @returns {Array<{ key: string, title: string, icon: string, rows: Array<{label: string, value: string}> }>}
 */
export function buildVehicleSections(vehicle) {
  const details = vehicle.details || {};
  const speed = isEmpty(vehicle.live_speed) ? null : Math.round(Number(vehicle.live_speed));
  const course = vehicle.course ?? details.course;
  const hasPosition = !isEmpty(vehicle.lat) && !isEmpty(vehicle.lng);

  const sections = [
    {
      key: 'live',
      title: 'Live status',
      icon: 'broadcast',
      rows: [
        row('Status', vehicle.status, true),
        row('Speed', withUnit(speed, 'km/h'), true),
        row('Engine', onOff(vehicle.engine_status), true),
        row('Engine blocked', onOff(vehicle.engine_blocked)),
        row('Heading', isEmpty(course) ? null : `${course}°`),
        row('Altitude', withUnit(details.altitude, 'm')),
        row('Last update', formatBdDateTime(vehicle.last_position_stamp), true),
        row('Reported', formatTimeAgo(vehicle.last_position_stamp)),
      ],
    },
    {
      key: 'location',
      title: 'Location',
      icon: 'map-marker-outline',
      rows: [
        row('Address', vehicle.address, true),
        row('Coordinates', hasPosition ? `${Number(vehicle.lat).toFixed(6)}, ${Number(vehicle.lng).toFixed(6)}` : null),
      ],
    },
    {
      key: 'distance',
      title: 'Distance',
      icon: 'road-variant',
      rows: [
        row('Today', details.today_travel === undefined ? null : `${details.today_travel} ${details.today_travel_unit || 'Km'}`),
        row('Total', withUnit(details.total_distance, 'Km')),
      ],
    },
    {
      key: 'device',
      title: 'Vehicle & device',
      icon: 'car-info',
      rows: [
        row('Name', vehicle.device_name, true),
        row('Plate number', vehicle.plate_number),
        row('Registration number', details.registration_number),
        row('Device type', vehicle.device_type),
        row('Device model', details.device_model),
        row('SIM number', details.sim_number),
        row('VIN', details.vin),
        row('Driver', vehicle.driver_name || details.driver),
        row('Owner', details.object_owner),
        row('Comment', details.comment),
        row('Notes', details.additional_notes),
      ],
    },
  ];

  return sections
    .map((section) => ({ ...section, rows: section.rows.filter((item) => item.alwaysShow || item.value !== EMPTY) }))
    .filter((section) => section.rows.length > 0);
}
