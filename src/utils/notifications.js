// How an alert (event) from GET /notifications is drawn: icon, color and time text.
import dayjs from 'dayjs';

// Event type -> Paper icon + which theme color to use ('danger' | 'warning' | 'info' | 'success')
const TYPE_STYLES = {
  overspeed: { icon: 'speedometer', tone: 'danger' },
  zone_in: { icon: 'map-marker-check-outline', tone: 'info' },
  zone_out: { icon: 'map-marker-remove-outline', tone: 'warning' },
  ignition_on: { icon: 'key-variant', tone: 'success' },
  ignition_off: { icon: 'key-remove', tone: 'warning' },
  offline_duration: { icon: 'wifi-off', tone: 'warning' },
  stop_duration: { icon: 'car-brake-parking', tone: 'info' },
  idle_duration: { icon: 'timer-sand', tone: 'info' },
  sos: { icon: 'alert-octagon', tone: 'danger' },
  driver: { icon: 'account-switch', tone: 'info' },
};

/** @param {string} type Event type from the server, e.g. 'overspeed' */
export function getAlertStyle(type) {
  return TYPE_STYLES[type] || { icon: 'bell-outline', tone: 'info' };
}

/**
 * The server sends alert times already in the customer's time zone (Bangladesh), as "2026-10-08 12:22:46".
 * They are only rewritten for reading, never converted.
 * @returns {string} e.g. "08 Oct, 12:22 PM"
 */
export function formatAlertTime(text) {
  if (!text) {
    return '-';
  }
  const date = dayjs(String(text).replace(' ', 'T'));
  return date.isValid() ? date.format('DD MMM, hh:mm A') : '-';
}

/** Words for the list row: the server's title, else its message, else a readable type name. */
export function getAlertTitle(item) {
  if (item.title) {
    return item.title;
  }
  if (item.message) {
    return item.message;
  }
  const words = String(item.type || 'alert').replace(/_/g, ' ');
  return words.charAt(0).toUpperCase() + words.slice(1);
}
