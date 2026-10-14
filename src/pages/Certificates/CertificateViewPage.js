// One certificate shown inside the app (the portal's certificate page in a web view). Opens with `{ url, title }`.
import React, { useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';
import ErrorState from '../../components/common/ErrorState';
import { useTranslation } from '../../i18n/LanguageContext';
import { useAppTheme } from '../../theme';

export default function CertificateViewPage({ route }) {
  const { url } = route.params;
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [hasFailed, setHasFailed] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  if (hasFailed) {
    return (
      <ErrorState
        message={t('cert.loadFailed')}
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
