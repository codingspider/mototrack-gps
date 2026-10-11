// The DGePay payment screen: shows DGePay's page in a web view, then asks our server to confirm the payment.
// Success is only what the server says after it asked DGePay itself; this screen never decides that.
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import Skeleton from '../../components/skeleton/Skeleton';
import { DGEPAY } from '../../config/env';
import { checkoutCleared, confirmCheckout, selectCheckout } from '../../store/slices/paymentsSlice';
import { spacing, useAppTheme } from '../../theme';
import PaymentResult from './components/PaymentResult';

export default function PaymentCheckoutPage({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const checkout = useSelector(selectCheckout);
  const [isPageLoaded, setIsPageLoaded] = useState(false); // DGePay's page is big and can take a while
  const hasConfirmedRef = useRef(false); // DGePay can redirect more than once; confirm only one time
  const statusRef = useRef(checkout.status);
  statusRef.current = checkout.status;

  // Leaving while the server is still checking the payment would lose the result: block it
  useEffect(() => {
    const unsubscribe = navigation.addListener('beforeRemove', (event) => {
      if (statusRef.current === 'confirming') {
        event.preventDefault();
      }
    });
    return unsubscribe;
  }, [navigation]);

  // Forget an unfinished payment when the customer closes the screen
  useEffect(
    () => () => {
      if (statusRef.current !== 'succeeded') {
        dispatch(checkoutCleared());
      }
    },
    [dispatch],
  );

  const handleReturned = useCallback(() => {
    if (hasConfirmedRef.current) {
      return;
    }
    hasConfirmedRef.current = true;
    dispatch(confirmCheckout());
  }, [dispatch]);

  const handleShouldLoad = (request) => {
    if (request.url.startsWith(DGEPAY.returnUrl)) {
      handleReturned();
      return false; // do not open our own site's page, the app shows the result
    }
    return true;
  };

  const handleCheckAgain = () => dispatch(confirmCheckout());
  const handleDone = () => {
    dispatch(checkoutCleared());
    navigation.pop(2); // back to where the customer started (details or list)
  };

  if (checkout.status === 'paying' && checkout.paymentUrl) {
    return (
      <View style={[styles.screen, { backgroundColor: colors.background }]}>
        <WebView
          source={{ uri: checkout.paymentUrl }}
          onShouldStartLoadWithRequest={handleShouldLoad}
          onLoadEnd={() => setIsPageLoaded(true)}
          javaScriptEnabled
          domStorageEnabled
        />
        {!isPageLoaded && (
          <View style={[styles.loading, { backgroundColor: colors.background }]} pointerEvents="none">
            <Skeleton height={120} />
            <AppText variant="subtitle">Opening DGePay…</AppText>
            <AppText color={colors.textSecondary}>
              The payment page can take up to a minute to load on a slow connection. Please wait.
            </AppText>
          </View>
        )}
      </View>
    );
  }

  return (
    <PaymentResult
      checkout={checkout}
      onCheckAgain={handleCheckAgain}
      onDone={handleDone}
      onBack={() => navigation.goBack()}
    />
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  loading: { ...StyleSheet.absoluteFillObject, padding: spacing.md, gap: spacing.md },
});
