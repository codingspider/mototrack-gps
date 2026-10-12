// Shows where one alert happened: a map with a pin at the event point, and a card with the title, time and address.
// Opens with `{ alertId }`; the alert is read from Redux (the Alerts tab list or a vehicle's alert list).
import React, { useEffect, useMemo, useState } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon } from 'react-native-paper';
import { useSelector } from 'react-redux';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import darkMapStyle from '../../components/map/darkMapStyle';
import VehicleIcon from '../../components/vehicle/VehicleIcon';
import useAddress from '../../hooks/useAddress';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { formatAlertTime, getAlertStyle, getAlertTitle } from '../../utils/notifications';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const ZOOM_DELTA = 0.005; // close enough to read the street
const MARKER_ICON_HEIGHT = 30;
const MARKER_REFRESH_MAX_MS = 3000; // stop refreshing the marker picture after this, even if the download is slow
const MARKER_SETTLE_MS = 200;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pin: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.surface,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg, padding: spacing.md },
    row: { flexDirection: 'row', gap: spacing.md },
    iconCircle: { width: 40, height: 40, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    info: { flex: 1, gap: 2 },
    title: { fontWeight: '700' },
    meta: { color: colors.textSecondary },
    empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: spacing.lg },
  });

/** Find one alert in the Alerts tab list or in any vehicle's alert list. */
const selectAlertById = (alertId) => (state) => {
  const fromTab = state.notifications.items.find((item) => item.id === alertId);
  if (fromTab) {
    return fromTab;
  }
  const lists = Object.values(state.deviceAlerts.byDevice);
  for (const list of lists) {
    const found = list.items.find((item) => item.id === alertId);
    if (found) {
      return found;
    }
  }
  return null;
};

export default function AlertLocationPage({ route }) {
  const { alertId } = route.params;
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const item = useSelector(selectAlertById(alertId));
  const address = useAddress(item ? item.address : '', item ? item.latitude : null, item ? item.longitude : null);

  const latitude = item ? Number(item.latitude) : 0;
  const longitude = item ? Number(item.longitude) : 0;
  const hasPoint = !!item && Number.isFinite(latitude) && Number.isFinite(longitude) && (latitude !== 0 || longitude !== 0);
  const region = useMemo(
    () => ({ latitude, longitude, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }),
    [latitude, longitude],
  );

  // The vehicle's own picture (same as everywhere in the app), read from Redux by the alert's vehicle id
  const vehicleId = item && item.device ? item.device.id : null;
  const vehicle = useSelector(selectVehicleById(vehicleId));
  const [isTrackingView, setIsTrackingView] = useState(true);
  useEffect(() => {
    const timer = setTimeout(() => setIsTrackingView(false), MARKER_REFRESH_MAX_MS);
    return () => clearTimeout(timer);
  }, []);
  const handleIconLoaded = () => setTimeout(() => setIsTrackingView(false), MARKER_SETTLE_MS);

  if (!hasPoint) {
    return (
      <View style={[styles.screen, styles.empty]}>
        <AppText color={colors.textSecondary}>This alert has no location.</AppText>
      </View>
    );
  }

  const alertStyle = getAlertStyle(item.type);
  const toneColors = { danger: colors.secondary, warning: colors.accent, info: colors.info, success: colors.statusOnline };
  const color = toneColors[alertStyle.tone];
  const vehicleName = item.device ? item.device.name : '';

  return (
    <View style={styles.screen}>
      <MapView
        provider={PROVIDER_GOOGLE}
        style={StyleSheet.absoluteFill}
        initialRegion={region}
        customMapStyle={isDark ? darkMapStyle : undefined}
        toolbarEnabled={false}
        pitchEnabled={false}
      >
        {/* The marker is drawn once as a picture, so it keeps updating until the vehicle picture has loaded */}
        <Marker coordinate={{ latitude, longitude }} tracksViewChanges={isTrackingView} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={[styles.pin, { borderColor: color }]}>
            {vehicle ? (
              <VehicleIcon vehicle={vehicle} height={MARKER_ICON_HEIGHT} onLoadEnd={handleIconLoaded} />
            ) : (
              <Icon source={alertStyle.icon} size={24} color={color} />
            )}
          </View>
        </Marker>
      </MapView>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={[styles.iconCircle, { backgroundColor: `${color}22` }]}>
            <Icon source={alertStyle.icon} size={22} color={color} />
          </View>
          <View style={styles.info}>
            <AppText style={styles.title} numberOfLines={2}>
              {getAlertTitle(item)}
            </AppText>
            <AppText variant="caption" style={styles.meta} numberOfLines={1}>
              {[vehicleName, formatAlertTime(item.time)].filter(Boolean).join(' · ')}
            </AppText>
            {!!address && (
              <AppText variant="caption" style={styles.meta} numberOfLines={3}>
                {address}
              </AppText>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}
