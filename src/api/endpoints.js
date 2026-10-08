// Every server path in one place. If the backend changes a URL, change it only here.
const endpoints = {
  login: '/login',
  passwordReminder: '/password_reminder',
  profile: '/profile',
  vehicles: '/vehicles',
  vehicleDetails: '/vehicle-details',
  warrantyCheck: '/warranty-check',
  addGeofence: '/add_geofence',
  playback: '/get_playback',
  sliders: '/sliders',
  appSettings: '/app-settings',
};

export default endpoints;