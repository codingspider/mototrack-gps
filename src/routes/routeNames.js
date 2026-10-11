// Every route name as a constant, so there are no string typos.
const routeNames = {
  // Auth
  login: 'Login',
  forgotPassword: 'ForgotPassword',
  // The bottom tabs as one screen of MainStack (go through it to reach a tab from a pushed page)
  mainTabs: 'MainTabs',
  // Main tabs
  home: 'Home',
  map: 'Map',
  vehicles: 'Vehicles',
  reports: 'Reports',
  alerts: 'Alerts',
  // Opened from the Home header or a vehicle row (not tabs)
  account: 'Account',
  vehicleDetails: 'VehicleDetails',
  playback: 'Playback',
  overspeed: 'Overspeed',
  reportSummary: 'ReportSummary',
  fuelSettings: 'FuelSettings',
  routeFinder: 'RouteFinder',
  deviceAlerts: 'DeviceAlerts',
  geofences: 'Geofences',
  geofenceEditor: 'GeofenceEditor',
  payments: 'Payments',
  paymentCheckout: 'PaymentCheckout',
  // Inside the Reports tab
  reportsHub: 'ReportsHub',
  reportView: 'ReportView',
};

export default routeNames;