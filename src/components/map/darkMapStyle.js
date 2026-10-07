// Google Maps dark style (used only when Google's own map is on and the app is in dark mode).
const darkMapStyle = [
  { elementType: 'geometry', stylers: [{ color: '#1d2530' }] },
  { elementType: 'labels.text.fill', stylers: [{ color: '#8a96a6' }] },
  { elementType: 'labels.text.stroke', stylers: [{ color: '#1d2530' }] },
  { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#2e3947' }] },
  { featureType: 'road.highway', elementType: 'geometry', stylers: [{ color: '#3a4758' }] },
  { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0f1620' }] },
  { featureType: 'poi', stylers: [{ visibility: 'off' }] },
];

export default darkMapStyle;
