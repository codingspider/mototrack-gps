// Details of one vehicle. The live map fills the page. A bottom sheet sits on it: swipe up for all the details,
// swipe down to hide it and see the whole map. Everything comes from Redux and updates live.
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { Animated, AppState, StyleSheet, useWindowDimensions, View } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import VehicleMap from '../../components/map/VehicleMap';
import { useLiveAddress } from '../../hooks/useAddress';
import {
  selectAllVehicles,
  fetchVehicles,
  fetchVehicleDetails,
  fetchVehicleWarranty,
  selectVehicleById,
} from '../../store/slices/vehiclesSlice';
import routeNames from '../../routes/routeNames';
import { getRenewalNotice } from '../../utils/payments';
import { buildVehicleSections } from '../../utils/vehicleSections';
import { spacing, useThemedStyles } from '../../theme';
import ActionGrid from './components/ActionGrid';
import DetailSection from './components/DetailSection';
import DetailsSheet from './components/DetailsSheet';
import RenewalDialog from './components/RenewalDialog';
import SummaryPager from './components/SummaryPager';
import VehicleDetailsSkeleton from './VehicleDetailsSkeleton';

// While this page is open, the status (Engine Off / Idling / Moving / Offline) is read again from the server this
// often. The socket moves the vehicle live, but it does not tell when the engine is switched off.
const LIVE_STATUS_REFRESH_MS = 30 * 1000;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    header: { gap: spacing.sm, paddingBottom: spacing.lg },
  });

export default function VehicleDetailsPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const { height: screenHeight } = useWindowDimensions();
  // Height of the visible page (below the header), so the map and the sheet are sized from what the user sees
  const [pageHeight, setPageHeight] = useState(screenHeight);
  const vehicle = useSelector(selectVehicleById(id));
  const allVehicles = useSelector(selectAllVehicles);
  // How many pixels of the sheet show; the map buttons ride above it
  const visibleHeight = useRef(new Animated.Value(0)).current;
  const controlsLift = useMemo(() => Animated.multiply(visibleHeight, -1), [visibleHeight]);

  // Keep the status real time while the page is on screen and the app is open
  useFocusEffect(
    useCallback(() => {
      const timer = setInterval(() => {
        if (AppState.currentState === 'active') {
          dispatch(fetchVehicles({ force: true, silent: true })); // silent: no loading car on the pages below
        }
      }, LIVE_STATUS_REFRESH_MS);
      return () => clearInterval(timer);
    }, [dispatch]),
  );

  // The address of where the vehicle is now (follows it while it drives)
  const { address: liveAddress, isLooking: isLookingUpAddress } = useLiveAddress(vehicle?.lat, vehicle?.lng, id);
  const addressText = liveAddress || (isLookingUpAddress ? 'Finding the address…' : '');

  // Loads only if missing or stale (see condition in the thunk)
  useEffect(() => {
    dispatch(fetchVehicleDetails({ id }));
    dispatch(fetchVehicleWarranty({ id }));
  }, [dispatch, id]);

  useEffect(() => {
    if (vehicle?.device_name) {
      navigation.setOptions({ title: vehicle.device_name });
    }
  }, [navigation, vehicle?.device_name]);

  // Opening the full sheet makes sure the details are fresh (skipped when they were loaded a moment ago)
  const handleExpand = () => {
    dispatch(fetchVehicleDetails({ id }));
    dispatch(fetchVehicleWarranty({ id }));
  };

  const retry = () => {
    dispatch(fetchVehicleWarranty({ id, force: true }));
    dispatch(fetchVehicleDetails({ id, force: true }));
  };

  // Up / down arrows: the previous / next vehicle of the customer, in the same order as the Vehicles list.
  // The same screen shows the new vehicle (live, from Redux), so there is no new screen to back out of.
  const switchVehicle = (step) => {
    if (allVehicles.length < 2) {
      return;
    }
    const index = allVehicles.findIndex((item) => item.id === id);
    const nextIndex = (index + step + allVehicles.length) % allVehicles.length;
    navigation.setParams({ id: allVehicles[nextIndex].id });
  };

  // Expired or ending soon: ask once per vehicle (per visit to this page) if the customer wants to recharge
  const askedIdsRef = useRef(new Set());
  const [isRenewalOpen, setIsRenewalOpen] = useState(false);
  const expirationDate = vehicle?.details?.expiration_date;
  const renewalNotice = useMemo(() => getRenewalNotice(expirationDate), [expirationDate]);
  useEffect(() => {
    if (renewalNotice && !askedIdsRef.current.has(id)) {
      askedIdsRef.current.add(id);
      setIsRenewalOpen(true);
    } else {
      setIsRenewalOpen(false);
    }
  }, [renewalNotice, id]);

  const sections = useMemo(
    () => (vehicle ? buildVehicleSections(vehicle, { address: addressText }) : []),
    [vehicle, addressText],
  );

  if (!vehicle) {
    return <EmptyState text="Vehicle not found" />;
  }

  const isLoadingDetails = vehicle.detailsStatus === 'loading' && !vehicle.details;
  const hasDetailsError = vehicle.detailsStatus === 'failed' && !vehicle.details;

  return (
    <View style={styles.screen} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
      {/* key: a new vehicle gets a fresh map (its own marker, trail and follow state) */}
      <VehicleMap
        key={id}
        vehicleId={id}
        height={pageHeight}
        controlsLift={controlsLift}
      />
      <DetailsSheet
        pageHeight={pageHeight}
        visibleHeight={visibleHeight}
        onExpand={handleExpand}
        onPreviousVehicle={() => switchVehicle(-1)}
        onNextVehicle={() => switchVehicle(1)}
        header={
          <View style={styles.header}>
            <SummaryPager vehicleId={id} />
            <ActionGrid vehicleId={id} />
          </View>
        }
      >
        {isLoadingDetails && <VehicleDetailsSkeleton />}
        {hasDetailsError && <ErrorState message={vehicle.detailsError} onRetry={retry} />}
        {sections.map((section) => (
          <DetailSection key={section.key} title={section.title} icon={section.icon} rows={section.rows} />
        ))}
      </DetailsSheet>
      <RenewalDialog
        visible={isRenewalOpen}
        notice={renewalNotice}
        vehicleName={vehicle.device_name}
        onDismiss={() => setIsRenewalOpen(false)}
        onRecharge={() => {
          setIsRenewalOpen(false);
          navigation.navigate(routeNames.payments, { vehicleId: id });
        }}
      />
    </View>
  );
}
