// Street View in a pop up, like Google Maps: drag to look around, tap the arrows to move along the street.
// It finds the nearest street panorama to the vehicle and shows Google's interactive view in a web view.
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Linking, StyleSheet, View } from 'react-native';
import { IconButton, Modal, Portal } from 'react-native-paper';
import { WebView } from 'react-native-webview';
import { findStreetViewPanorama } from '../../api/streetViewApi';
import AppButton from '../common/AppButton';
import AppText from '../common/AppText';
import { MAPS_API_KEY } from '../../config/env';
import { EMBED_BASE_URL, getStreetViewAppUrl, getStreetViewHtml } from '../../utils/streetView';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const VIEW_HEIGHT = 380;

const makeStyles = (colors) =>
  StyleSheet.create({
    modal: { margin: spacing.md, borderRadius: radius.lg, backgroundColor: colors.surface, overflow: 'hidden' },
    header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingLeft: spacing.lg },
    view: { height: VIEW_HEIGHT, backgroundColor: colors.skeleton, justifyContent: 'center' },
    web: { flex: 1, backgroundColor: colors.skeleton },
    spinner: { position: 'absolute', alignSelf: 'center' },
    message: { textAlign: 'center', padding: spacing.lg },
    footer: { alignItems: 'center', padding: spacing.xs },
  });

/**
 * @param {boolean} visible
 * @param {function} onDismiss
 * @param {number} latitude Where to look
 * @param {number} longitude
 * @param {number} course Direction the vehicle faces; the view starts looking that way
 */
export default function StreetViewModal({ visible, onDismiss, latitude, longitude, course }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [panoId, setPanoId] = useState(null);
  const [status, setStatus] = useState('loading'); // 'loading' | 'ready' | 'none' | 'error'
  const [isPageLoading, setIsPageLoading] = useState(true);

  // Each time the pop up opens, look for the nearest street panorama
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    let isCancelled = false;
    const findPanorama = async () => {
      setStatus('loading');
      setIsPageLoading(true);
      if (!MAPS_API_KEY) {
        setStatus('none');
        return;
      }
      try {
        const data = await findStreetViewPanorama(latitude, longitude);
        if (isCancelled) {
          return;
        }
        if (data.status === 'OK' && data.pano_id) {
          setPanoId(data.pano_id);
          setStatus('ready');
        } else {
          setStatus('none');
        }
      } catch (error) {
        if (!isCancelled) {
          setStatus('error');
        }
      }
    };
    findPanorama();
    return () => {
      isCancelled = true;
    };
  }, [visible, latitude, longitude]);

  return (
    <Portal>
      <Modal visible={visible} onDismiss={onDismiss} contentContainerStyle={styles.modal}>
        <View style={styles.header}>
          <AppText variant="subtitle">Street View</AppText>
          <IconButton icon="close" iconColor={colors.text} onPress={onDismiss} accessibilityLabel="Close" />
        </View>
        <View style={styles.view}>
          {status === 'ready' && (
            <WebView
              style={styles.web}
              originWhitelist={['*']}
              source={{ html: getStreetViewHtml(panoId, course || 0, MAPS_API_KEY), baseUrl: EMBED_BASE_URL }}
              javaScriptEnabled
              nestedScrollEnabled
              onLoadEnd={() => setIsPageLoading(false)}
              onError={() => setStatus('error')}
            />
          )}
          {(status === 'loading' || (status === 'ready' && isPageLoading)) && (
            <ActivityIndicator color={colors.primary} style={styles.spinner} />
          )}
          {status === 'none' && (
            <AppText color={colors.textSecondary} style={styles.message}>
              {MAPS_API_KEY
                ? 'There is no Street View near this vehicle.'
                : 'Add GOOGLE_MAPS_API_KEY to the .env file to see Street View here.'}
            </AppText>
          )}
          {status === 'error' && (
            <AppText color={colors.textSecondary} style={styles.message}>
              Street View could not load. Check the internet connection and that "Maps Embed API" is enabled for your
              Google key.
            </AppText>
          )}
        </View>
        <View style={styles.footer}>
          <AppButton
            title="Open in Google Maps"
            variant="link"
            icon="open-in-new"
            onPress={() => Linking.openURL(getStreetViewAppUrl(latitude, longitude, course || 0))}
          />
        </View>
      </Modal>
    </Portal>
  );
}
