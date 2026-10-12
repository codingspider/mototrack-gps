// Shows one point of a report on a map inside the app, with a card for the vehicle, the time and the address.
// Opens with `{ latitude, longitude, title, subtitle, address? }` (a few plain values, not a server object).
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import MapView, { Marker, PROVIDER_GOOGLE } from 'react-native-maps';
import { Icon } from 'react-native-paper';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import darkMapStyle from '../../components/map/darkMapStyle';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const ZOOM_DELTA = 0.005; // close enough to read the street

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    pin: {
      width: 44,
      height: 44,
      borderRadius: radius.round,
      borderWidth: 3,
      borderColor: colors.secondary,
      backgroundColor: colors.surface,
      alignItems: 'center',
      justifyContent: 'center',
    },
    card: { position: 'absolute', left: spacing.md, right: spacing.md, bottom: spacing.lg, padding: spacing.md },
    row: { flexDirection: 'row', gap: spacing.md },
    iconCircle: {
      width: 40,
      height: 40,
      borderRadius: radius.round,
      backgroundColor: colors.secondarySoft,
      alignItems: 'center',
      justifyContent: 'center',
    },
    info: { flex: 1, gap: 2 },
    title: { fontWeight: '700' },
  });

export default function PointLocationPage({ route }) {
  const { latitude, longitude, title, subtitle, address } = route.params;
  const { colors, isDark } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const region = useMemo(
    () => ({ latitude, longitude, latitudeDelta: ZOOM_DELTA, longitudeDelta: ZOOM_DELTA }),
    [latitude, longitude],
  );

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
        <Marker coordinate={{ latitude, longitude }} anchor={{ x: 0.5, y: 0.5 }}>
          <View style={styles.pin}>
            <Icon source="map-marker" size={24} color={colors.secondary} />
          </View>
        </Marker>
      </MapView>

      <Card style={styles.card}>
        <View style={styles.row}>
          <View style={styles.iconCircle}>
            <Icon source="map-marker-outline" size={22} color={colors.secondary} />
          </View>
          <View style={styles.info}>
            <AppText style={styles.title} numberOfLines={2}>
              {title}
            </AppText>
            {!!subtitle && (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {subtitle}
              </AppText>
            )}
            {!!address && address !== '-' && (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={3}>
                {address}
              </AppText>
            )}
          </View>
        </View>
      </Card>
    </View>
  );
}
