// Fleet status grid from the design: total, online, moving, stop, expired, offline. Live from Redux.
import React, { useMemo } from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import routeNames from '../../../routes/routeNames';
import { selectVehicleCounts } from '../../../store/slices/vehiclesSlice';
import { radius, spacing, useAppTheme } from '../../../theme';

// Each tile gets its colors from theme tokens, so a brand change or dark mode updates the grid too.
function getTones(colors) {
  return {
    total: {
      fg: colors.primary,
      bg: colors.primaryLight,
      soft: colors.primarySoft,
      border: colors.primaryBorder,
      number: colors.text,
    },
    online: {
      fg: colors.statusOnline,
      bg: colors.statusOnlineLight,
      soft: colors.statusOnlineSoft,
      border: colors.statusOnlineBorder,
      number: colors.statusOnline,
    },
    moving: {
      fg: colors.accent,
      bg: colors.accentLight,
      soft: colors.accentSoft,
      border: colors.accentBorder,
      number: colors.accent,
    },
    stop: {
      fg: colors.secondary,
      bg: colors.secondaryLight,
      soft: colors.secondarySoft,
      border: colors.secondaryBorder,
      number: colors.secondary,
    },
    suspended: {
      fg: colors.accent,
      bg: colors.accentLight,
      soft: colors.accentSoft,
      border: colors.accentBorder,
      number: colors.accent,
    },
    offline: {
      fg: colors.statusOffline,
      bg: colors.statusOfflineLight,
      soft: colors.statusOfflineSoft,
      border: colors.statusOfflineBorder,
      number: colors.text,
    },
  };
}

function Tile({ label, value, icon, tone, onPress }) {
  return (
    <TouchableRipple
      onPress={onPress}
      borderless
      style={[styles.tile, { backgroundColor: tone.bg, borderColor: tone.border }]}
    >
      <View style={styles.tileContent}>
        <View style={styles.topRow}>
          <View style={[styles.iconCircle, { backgroundColor: tone.soft }]}>
            <Icon source={icon} size={16} color={tone.fg} />
          </View>
          <AppText variant="title" color={tone.number}>
            {value}
          </AppText>
        </View>
        <AppText variant="caption" color={tone.fg} style={styles.label}>
          {label}
        </AppText>
      </View>
    </TouchableRipple>
  );
}

export default function CountTiles() {
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const tones = useMemo(() => getTones(colors), [colors]);
  const counts = useSelector(selectVehicleCounts);
  const openVehicles = () => navigation.navigate(routeNames.vehicles);

  // "Online" = every vehicle that is not offline
  const online = counts.total - counts.offline;

  return (
    <View style={styles.grid}>
      <Tile label="TOTAL" value={counts.total} icon="car-side" tone={tones.total} onPress={openVehicles} />
      <Tile label="ONLINE" value={online} icon="map-marker-check" tone={tones.online} onPress={openVehicles} />
      <Tile label="MOVING" value={counts.moving} icon="truck-fast" tone={tones.moving} onPress={openVehicles} />
      <Tile label="STOP" value={counts.idle} icon="car-brake-parking" tone={tones.stop} onPress={openVehicles} />
      <Tile
        label="EXPIRED"
        value={counts.suspended}
        icon="pause-circle-outline"
        tone={tones.suspended}
        onPress={openVehicles}
      />
      <Tile label="OFFLINE" value={counts.offline} icon="wifi-off" tone={tones.offline} onPress={openVehicles} />
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', rowGap: spacing.sm },
  tile: {
    width: '32%',
    borderRadius: radius.md,
    borderWidth: 1.5,
    borderBottomWidth: 4,
  },
  tileContent: { alignItems: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.sm },
  topRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: {
    width: 28,
    height: 28,
    borderRadius: radius.round,
    alignItems: 'center',
    justifyContent: 'center',
  },
  label: { fontWeight: '700', letterSpacing: 0.4 },
});
