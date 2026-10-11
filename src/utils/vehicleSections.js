// Turns one vehicle (list data + the /vehicle-details data) into labelled rows for the details page.
// Pure function, no UI. Rows with no value are hidden unless they are marked alwaysShow.
// Never show the device IMEI or protocol in the app. The service expiry and warranty are in the "Service" section.
import { formatBdDateTime, formatDateOnly, formatTimeAgo, getDaysLeft } from './formatDate';

const EMPTY = '-';

/** "12 days left", "Expired 3 days ago", "Expires today" or "No expiry date set". */
function getDaysLeftText(expirationDate) {
  const daysLeft = getDaysLeft(expirationDate);
  if (daysLeft === null) {
    return 'No expiry date set';
  }
  const days = Math.abs(daysLeft);
  const unit = days === 1 ? 'day' : 'days';
  if (daysLeft < 0) {
    return `Expired ${days} ${unit} ago`;
  }
  return daysLeft === 0 ? 'Expires today' : `${days} ${unit} left`;
}

/** "Valid until 26 Sep 2027" / "Expired on ..." from GET /warranty-check, or null until it is loaded. */
function getWarrantyText(warranty) {
  if (!warranty) {
    return null;
  }
  const dateText = formatDateOnly(warranty.warranty_end);
  return warranty.expired ? `Expired on ${dateText}` : `Valid until ${dateText}`;
}

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
      key: 'service',
      title: 'Service',
      icon: 'calendar-clock',
      rows: [
        row('Service expires', details.expiration_date ? formatDateOnly(details.expiration_date) : null, true),
        row('Days left', getDaysLeftText(details.expiration_date), true),
        row('Device warranty', getWarrantyText(vehicle.warranty)),
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
