// Terms and conditions / Privacy policy, shown inside the app. The server writes the page (Admin > Pages) and gives
// its address in GET /legal-pages; the page is opened here in a web view, so the customer never leaves the app.
// Opens with `{ slug: 'terms_conditions' | 'privacy_policy' }`.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import { useDispatch, useSelector } from 'react-redux';
import ErrorState from '../../components/common/ErrorState';
import { SOCKET_URL } from '../../config/env';
import { fetchLegalPages, selectLegalPage, selectLegalStatus } from '../../store/slices/legalSlice';
import { useAppTheme } from '../../theme';

export default function LegalPage({ route }) {
  const { slug } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const page = useSelector(selectLegalPage(slug));
  const status = useSelector(selectLegalStatus);
  const [hasFailed, setHasFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  useEffect(() => {
    dispatch(fetchLegalPages());
  }, [dispatch]);

  // Wait for the server's address; if the list could not be loaded, the page is at a known place on the portal
  const isWaiting = !page && (status === 'idle' || status === 'loading');
  const url = page ? page.url : `${SOCKET_URL}/legal/${slug}`;

  if (isWaiting) {
    return (
      <View style={[styles.center, { backgroundColor: colors.background }]}>
        <ActivityIndicator color={colors.primary} />
      </View>
    );
  }

  if (hasFailed) {
    return (
      <ErrorState
        message="The page could not be loaded. Check your internet connection."
        onRetry={() => {
          setHasFailed(false);
          setReloadKey((current) => current + 1);
        }}
      />
    );
  }

  return (
    <View style={[styles.screen, { backgroundColor: colors.background }]}>
      <WebView
        key={reloadKey}
        source={{ uri: url }}
        style={{ backgroundColor: colors.background }}
        startInLoadingState
        renderLoading={() => (
          <View style={[styles.center, styles.loading, { backgroundColor: colors.background }]}>
            <ActivityIndicator color={colors.primary} />
          </View>
        )}
        onError={() => setHasFailed(true)}
        onHttpError={() => setHasFailed(true)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loading: { ...StyleSheet.absoluteFillObject },
});
