// Route finder and Route analytics: a route from the phone's location (or another place) to a place, with the
// distance, the time in today's traffic and Google's traffic on the map.
//  - Route finder   { mode: 'finder' }: the customer picks where to go (and may pick another start).
//  - Route analytics { mode: 'analytics', vehicleId }: the destination is the vehicle's current position.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { PermissionsAndroid, Platform, StyleSheet, View } from 'react-native';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import MapControlButton from '../../components/map/MapControlButton';
import Skeleton from '../../components/skeleton/Skeleton';
import { clearPlaces, clearRoute, findRoute, searchPlaces, selectRoute, selectRouteState } from '../../store/slices/routeSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { straightLineMeters } from '../../utils/directions';
import { getVehicleCoordinate } from '../../utils/vehicleFilter';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import PlaceField from './components/PlaceField';
import PlaceResults from './components/PlaceResults';
import RouteMap from './components/RouteMap';
import RouteSummary from './components/RouteSummary';

const SEARCH_DELAY_MS = 350;
const MIN_SEARCH_LENGTH = 2;
const VEHICLE_MOVED_METERS = 300; // Route analytics: route again when the vehicle moved this far
const MOVED_METERS = 100; // the route is asked again when the phone is this far from where the route started

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    fields: { margin: spacing.sm, padding: spacing.sm, gap: spacing.sm },
    mapArea: { flex: 1 },
    bottom: { position: 'absolute', left: 0, right: 0, bottom: 0, padding: spacing.sm, gap: spacing.sm },
    traffic: { position: 'absolute', right: spacing.md, top: spacing.md },
    hint: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.md, alignItems: 'center' },
    loading: { position: 'absolute', left: spacing.sm, right: spacing.sm, bottom: spacing.sm },
  });

export default function RouteFinderPage({ route: navRoute, navigation }) {
  const { mode, vehicleId } = navRoute.params;
  const isAnalytics = mode === 'analytics';
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const { routes, selectedIndex, status, error, places } = useSelector(selectRouteState);

  const [hasPermission, setHasPermission] = useState(Platform.OS !== 'android');
  const [myLocation, setMyLocation] = useState(null);
  const [destination, setDestination] = useState(null); // { placeId, label } (finder), or the vehicle's spot
  const [origin, setOrigin] = useState(null); // null = my location
  const [activeField, setActiveField] = useState(null); // 'from' | 'to' | null
  const [fromText, setFromText] = useState('');
  const [toText, setToText] = useState('');
  const [showsTraffic, setShowsTraffic] = useState(true);
  const myLocationRef = useRef(null);
  const routedVehicleSpotRef = useRef(null); // where the vehicle was when the route was last drawn

  const vehicleSpot = isAnalytics ? getVehicleCoordinate(vehicle) : null;
  const selected = routes[selectedIndex] || null;
  const activeText = activeField === 'from' ? fromText : toText;

  // Title, and a clean start (no route left over from the last time)
  useEffect(() => {
    navigation.setOptions({ title: isAnalytics ? 'Route analytics' : 'Route finder' });
    dispatch(clearRoute());
    dispatch(clearPlaces());
    return () => {
      dispatch(clearRoute());
      dispatch(clearPlaces());
    };
  }, [dispatch, isAnalytics, navigation]);

  // The blue dot and "my location" need the location permission
  useEffect(() => {
    if (Platform.OS !== 'android') {
      return;
    }
    PermissionsAndroid.request(PermissionsAndroid.PERMISSIONS.ACCESS_FINE_LOCATION).then((result) => {
      setHasPermission(result === PermissionsAndroid.RESULTS.GRANTED);
    });
  }, []);

  const handleUserLocation = useCallback((event) => {
    const coordinate = event && event.nativeEvent && event.nativeEvent.coordinate;
    if (!coordinate) {
      return;
    }
    const point = { latitude: coordinate.latitude, longitude: coordinate.longitude };
    myLocationRef.current = point;
    // The first fix can be the phone's old last-known place, so every real move updates it. Small GPS jitter is
    // ignored, so the route is not asked again on every tiny change.
    setMyLocation((current) => (current && straightLineMeters(current, point) < MOVED_METERS ? current : point));
  }, []);

  const runRoute = useCallback(
    (from, to) => {
      dispatch(findRoute({ origin: from, destination: to }));
    },
    [dispatch],
  );

  // Route analytics: route from where the phone is to the vehicle, and again when the phone moves far. The vehicle
  // moves all the time (socket), so that is left to the refresh button, not a new request on every move.
  const vehicleSpotRef = useRef(null);
  vehicleSpotRef.current = vehicleSpot;
  useEffect(() => {
    if (isAnalytics && myLocation && vehicleSpotRef.current) {
      routedVehicleSpotRef.current = vehicleSpotRef.current;
      runRoute(myLocation, vehicleSpotRef.current);
    }
  }, [isAnalytics, myLocation, runRoute]);

  // The vehicle is followed too: when it is 300 m or more from where the route was drawn to, route again
  const vehicleLat = vehicleSpot ? vehicleSpot.latitude : null;
  const vehicleLng = vehicleSpot ? vehicleSpot.longitude : null;
  useEffect(() => {
    const routedTo = routedVehicleSpotRef.current;
    if (!isAnalytics || !myLocation || vehicleLat === null || !routedTo) {
      return;
    }
    const current = { latitude: vehicleLat, longitude: vehicleLng };
    if (straightLineMeters(routedTo, current) >= VEHICLE_MOVED_METERS) {
      routedVehicleSpotRef.current = current;
      runRoute(myLocation, current);
    }
  }, [isAnalytics, myLocation, vehicleLat, vehicleLng, runRoute]);

  // Route finder: when a destination is chosen (or the start changes), route
  useEffect(() => {
    if (isAnalytics || !destination) {
      return;
    }
    const start = origin || myLocationRef.current;
    if (start) {
      runRoute(start, destination);
    }
  }, [isAnalytics, destination, origin, myLocation, runRoute]);

  // Search places while typing (a short pause first, so it does not ask on every letter)
  useEffect(() => {
    if (!activeField || activeText.trim().length < MIN_SEARCH_LENGTH) {
      return undefined;
    }
    const timer = setTimeout(() => {
      dispatch(searchPlaces({ text: activeText.trim(), near: myLocationRef.current }));
    }, SEARCH_DELAY_MS);
    return () => clearTimeout(timer);
  }, [activeField, activeText, dispatch]);

  const pickPlace = (item) => {
    const place = { placeId: item.placeId, label: item.title };
    if (activeField === 'from') {
      setOrigin(place);
      setFromText(item.title);
    } else {
      setDestination(place);
      setToText(item.title);
    }
    setActiveField(null);
    dispatch(clearPlaces());
  };

  const pickMyLocation = () => {
    setOrigin(null);
    setFromText('');
    setActiveField(null);
    dispatch(clearPlaces());
  };

  const refreshAnalytics = () => {
    if (myLocationRef.current && vehicleSpot) {
      runRoute(myLocationRef.current, vehicleSpot);
    }
  };

  const isSearching = !!activeField;
  const straightLine = selected && selected.start && selected.end ? straightLineMeters(selected.start, selected.end) : null;
  const fromLabel = origin ? fromText : 'My location';
  const waitingForLocation = isAnalytics && !myLocation && status === 'idle';

  return (
    <View style={styles.screen}>
      <Card style={styles.fields}>
        <PlaceField
          label="From"
          icon="circle-slice-8"
          value={isSearching && activeField === 'from' ? fromText : fromLabel}
          isFixed={isAnalytics}
          placeholder="My location"
          onFocus={() => {
            setActiveField('from');
            setFromText((current) => (origin ? current : ''));
          }}
          onChangeText={setFromText}
        />
        <PlaceField
          label="To"
          icon="map-marker"
          value={isAnalytics ? (vehicle ? vehicle.device_name : '') : toText}
          isFixed={isAnalytics}
          subtitle={isAnalytics && vehicle ? vehicle.address : undefined}
          placeholder="Where to? e.g. Dhaka"
          onFocus={() => setActiveField('to')}
          onChangeText={setToText}
          onClear={() => {
            setToText('');
            setDestination(null);
            dispatch(clearRoute());
          }}
        />
      </Card>

      <View style={styles.mapArea}>
        {isSearching ? (
          <PlaceResults
            items={places.items}
            isLoading={places.status === 'loading'}
            error={places.error}
            hasQuery={activeText.trim().length >= MIN_SEARCH_LENGTH}
            showMyLocation={activeField === 'from'}
            onPick={pickPlace}
            onPickMyLocation={pickMyLocation}
          />
        ) : (
          <>
            <RouteMap
              routes={routes}
              selectedIndex={selectedIndex}
              showsTraffic={showsTraffic}
              showsUserLocation={hasPermission}
              onUserLocationChange={handleUserLocation}
              vehicleSpot={vehicleSpot}
              vehicleName={vehicle ? vehicle.device_name : undefined}
            />
            <View style={styles.traffic}>
              <MapControlButton icon="traffic-light" label="Traffic" isActive={showsTraffic} onPress={() => setShowsTraffic((on) => !on)} />
              {isAnalytics && <MapControlButton icon="refresh" label="Refresh" onPress={refreshAnalytics} />}
            </View>
            {status === 'loading' && (
              <View style={styles.loading}>
                <Skeleton height={110} />
              </View>
            )}
            {status !== 'loading' && !!selected && (
              <View style={styles.bottom}>
                <RouteSummary
                  routes={routes}
                  selectedIndex={selectedIndex}
                  onSelect={(index) => dispatch(selectRoute(index))}
                  straightLine={straightLine}
                />
              </View>
            )}
            {status === 'failed' && (
              <View style={styles.hint}>
                <Card>
                  <AppText color={colors.secondary}>{error}</AppText>
                </Card>
              </View>
            )}
            {!selected && status === 'idle' && (
              <View style={styles.hint}>
                <Card>
                  <AppText color={colors.textSecondary}>
                    {waitingForLocation
                      ? hasPermission
                        ? 'Finding your location…'
                        : 'Allow location for the app to see how far this vehicle is from you'
                      : 'Choose where you want to go'}
                  </AppText>
                </Card>
              </View>
            )}
          </>
        )}
      </View>
    </View>
  );
}
