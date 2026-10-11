// The map of the route: the roads in orange (the other routes in gray), Google's live traffic, and the two ends.
import React, { useEffect, useRef } from 'react';
import { StyleSheet } from 'react-native';
import MapView, { Marker, Polyline, PROVIDER_GOOGLE } from 'react-native-maps';
import darkMapStyle from '../../../components/map/darkMapStyle';
import { useAppTheme } from '../../../theme';

const EDGE_PADDING = { top: 60, right: 40, bottom: 60, left: 40 };
const BANGLADESH_REGION = { latitude: 23.8, longitude: 90.4, latitudeDelta: 4, longitudeDelta: 4 };

/**
 * @param {object[]} routes Parsed routes
 * @param {number} selectedIndex
 * @param {boolean} showsTraffic Google's traffic colors on the roads
 * @param {boolean} showsUserLocation Blue dot (needs the location permission)
 * @param {function} onUserLocationChange MapView event handler
 * @param {{ latitude: number, longitude: number }|null} vehicleSpot Where the vehicle is (Route analytics)
 * @param {string} vehicleName
 */
export default function RouteMap({
  routes,
  selectedIndex,
  showsTraffic,
  showsUserLocation,
  onUserLocationChange,
  vehicleSpot,
  vehicleName,
}) {
  const { colors, isDark } = useAppTheme();
  const mapRef = useRef(null);
  const selected = routes[selectedIndex] || null;
  const routesKey = routes.map((item) => `${item.distanceMeters}:${item.points.length}`).join('|');

  // Show the whole new route (not on every route chip tap, so the customer's zoom is kept)
  useEffect(() => {
    if (routes.length > 0 && routes[0].points.length > 1) {
      mapRef.current?.fitToCoordinates(routes[0].points, { edgePadding: EDGE_PADDING, animated: true });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [routesKey]);

  return (
    <MapView
      ref={mapRef}
      provider={PROVIDER_GOOGLE}
      style={StyleSheet.absoluteFill}
      initialRegion={BANGLADESH_REGION}
      customMapStyle={isDark ? darkMapStyle : undefined}
      showsUserLocation={showsUserLocation}
      showsMyLocationButton={false}
      showsTraffic={showsTraffic}
      toolbarEnabled={false}
      pitchEnabled={false}
      onUserLocationChange={onUserLocationChange}
    >
      {routes.map((item, index) =>
        index === selectedIndex ? null : (
          <Polyline key={item.id} coordinates={item.points} strokeColor={colors.textSecondary} strokeWidth={5} />
        ),
      )}
      {!!selected && <Polyline coordinates={selected.points} strokeColor={colors.primary} strokeWidth={6} />}
      {!!selected && !!selected.start && <Marker coordinate={selected.start} title="Start" pinColor={colors.statusOnline} />}
      {!!selected && !!selected.end && <Marker coordinate={selected.end} title={vehicleName || 'Destination'} pinColor={colors.secondary} />}
      {!selected && !!vehicleSpot && <Marker coordinate={vehicleSpot} title={vehicleName} pinColor={colors.secondary} />}
    </MapView>
  );
}
