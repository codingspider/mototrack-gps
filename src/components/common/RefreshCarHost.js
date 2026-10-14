// The running-car animation (src/assets/running-car.json), small and without any background, in the clear slot just
// under the top header (the page moves its content down while refreshing, see useRefreshSlotStyle). Shows while any
// page is pull-to-refreshing (see AppRefreshControl). Mounted once in App.js.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import LottieView from 'lottie-react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useSelector } from 'react-redux';
import { selectIsRefreshing, selectRefreshPlacement } from '../../store/slices/refreshCarSlice';
import { CAR_HEIGHT, CAR_MARGIN, CAR_WIDTH } from '../../utils/refreshCar';
import { spacing } from '../../theme';

const STACK_HEADER_HEIGHT = 56; // the navigation header
const HOME_LOGO_HEIGHT = 52; // the Home header: its logo (see GreetingHeader)

export default function RefreshCarHost() {
  const insets = useSafeAreaInsets();
  const isRefreshing = useSelector(selectIsRefreshing);
  const placement = useSelector(selectRefreshPlacement);

  if (!isRefreshing) {
    return null;
  }

  // Bottom edge of the header the car sits under
  const headerBottom =
    placement === 'home'
      ? insets.top + spacing.sm + HOME_LOGO_HEIGHT + spacing.md
      : insets.top + STACK_HEADER_HEIGHT;

  return (
    <View pointerEvents="none" style={[styles.wrapper, { top: headerBottom + CAR_MARGIN }]}>
      <LottieView source={require('../../assets/running-car.json')} autoPlay loop style={styles.animation} />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { position: 'absolute', left: 0, right: 0, alignItems: 'center', zIndex: 900, elevation: 8 },
  animation: { width: CAR_WIDTH, height: CAR_HEIGHT },
});
