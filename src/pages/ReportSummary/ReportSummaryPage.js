// Report summary of one vehicle: distance with a little graph, then trips, driving, parking, engine, speed and fuel
// for Today / Yesterday / Last 7 days. Opened from the Reports button on the vehicle details page with `{ vehicleId }`.
import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import dayjs from 'dayjs';
import { useDispatch, useSelector } from 'react-redux';
import AppButton from '../../components/common/AppButton';
import AppText from '../../components/common/AppText';
import ErrorState from '../../components/common/ErrorState';
import routeNames from '../../routes/routeNames';
import {
  fetchFuelSettings,
  selectFuelSettings,
} from '../../store/slices/fuelSettingsSlice';
import {
  fetchReportSummary,
  selectReportSummary,
} from '../../store/slices/reportSummarySlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectAllVehicles } from '../../store/slices/vehiclesSlice';
import { estimateFuel } from '../../utils/fuelSettings';
import { getPresetRange } from '../../utils/playbackRange';
import { formatMoney } from '../../utils/payments';
import { SUMMARY_PRESETS } from '../../utils/reportSummary';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import ExportRow from './components/ExportRow';
import StatCard from './components/StatCard';
import SummaryFilters from './components/SummaryFilters';
import SummaryHero from './components/SummaryHero';
import ReportSummarySkeleton from './ReportSummarySkeleton';

const makeStyles = colors =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: {
      padding: spacing.md,
      gap: spacing.md,
      paddingBottom: spacing.xxl,
    },
    title: { fontSize: 30, lineHeight: 36, fontWeight: '800' },
    row: { flexDirection: 'row', gap: spacing.sm },
  });

/** "11 Oct 2026" for one day, "05 Oct – 11 Oct" for a longer range. */
function describeDates(preset) {
  const { fromDate, toDate } = getPresetRange(preset);
  if (fromDate === toDate) {
    return dayjs(fromDate).format('DD MMM YYYY');
  }
  return `${dayjs(fromDate).format('DD MMM')} – ${dayjs(toDate).format(
    'DD MMM',
  )}`;
}

export default function ReportSummaryPage({ route, navigation }) {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicles = useSelector(selectAllVehicles);
  const summary = useSelector(selectReportSummary);
  const [vehicleId, setVehicleId] = useState(route.params.vehicleId);
  const [preset, setPreset] = useState('today');
  const fuelSettings = useSelector(selectFuelSettings(vehicleId)).settings;

  // Loads when the vehicle or the range changes; the same one asked for within a minute is not asked again
  useEffect(() => {
    dispatch(fetchReportSummary({ vehicleId, preset }));
  }, [dispatch, vehicleId, preset]);

  // The big title is on the page, so the header shows which vehicle the numbers are for
  const vehicleName = vehicles.find(
    vehicle => vehicle.id === vehicleId,
  )?.device_name;
  useEffect(() => {
    navigation.setOptions({ title: vehicleName || 'Reports' });
  }, [navigation, vehicleName]);

  // The vehicle's fuel rate, to estimate fuel when it has no fuel sensor (loads once in a while)
  useEffect(() => {
    dispatch(fetchFuelSettings({ deviceId: vehicleId }));
  }, [dispatch, vehicleId]);

  const refresh = () =>
    dispatch(fetchReportSummary({ vehicleId, preset, force: true }));
  const handleExport = kind =>
    dispatch(
      showToast({
        type: 'info',
        message: `${kind} export is coming soon (the server needs an export endpoint)`,
      }),
    );

  const presetLabel = SUMMARY_PRESETS.find(item => item.key === preset).label;
  const dateText = describeDates(preset);
  const isCurrent = summary.key === `${vehicleId}:${preset}`;
  const data = isCurrent ? summary.data : null;
  const isLoading = summary.status === 'loading' && !data;
  const hasFailed = summary.status === 'failed' && !data;
  const isSingleDay = preset !== 'week';

  const renderBody = () => {
    if (isLoading) {
      return <ReportSummarySkeleton />;
    }
    if (hasFailed) {
      return <ErrorState message={summary.error} onRetry={refresh} />;
    }
    const numbers = data || {};
    // A fuel sensor's number wins; without one, estimate from the rate set in Fuel settings
    const estimate = numbers.fuel
      ? null
      : estimateFuel(
          fuelSettings,
          numbers.distanceValue,
          numbers.engineSeconds,
        );
    let fuelValue = numbers.fuel;
    let fuelCaption = 'No fuel sensor';
    if (numbers.fuel) {
      fuelCaption = 'Total fuel usage';
    } else if (estimate) {
      fuelValue = `≈ ${estimate.amount} ${estimate.unit}`;
      fuelCaption =
        estimate.cost === null
          ? 'Estimated from fuel settings'
          : `Estimated · ${formatMoney(estimate.cost)}`;
    } else if (fuelSettings && fuelSettings.measurementId) {
      fuelCaption = 'Not enough data to estimate';
    } else {
      fuelCaption = 'Set the fuel rate in Fuel settings';
    }
    return (
      <>
        <SummaryHero
          distanceKm={numbers.distanceKm}
          caption={`Distance · ${presetLabel}`}
          series={numbers.series || []}
        />
        <View style={styles.row}>
          <StatCard
            icon="map-marker-path"
            label="Trips"
            value={numbers.trips}
            caption="Total journeys"
          />
          <StatCard
            icon="steering"
            label="Driving"
            value={numbers.driving}
            caption="Time on the road"
          />
        </View>
        <View style={styles.row}>
          <StatCard
            icon="alpha-p-circle-outline"
            label="Parking"
            value={numbers.parking}
            caption="Total parked time"
          />
          <StatCard
            icon="engine-outline"
            label="Engine"
            value={numbers.engine}
            caption={isSingleDay ? 'Engine on time' : 'Pick a single day'}
          />
        </View>
        <View style={styles.row}>
          <StatCard
            icon="speedometer"
            label="Speed"
            value={numbers.avgSpeed}
            caption="Average speed"
          />
          <StatCard
            icon="gas-station-outline"
            label="Fuel"
            value={fuelValue}
            caption={fuelCaption}
          />
        </View>
      </>
    );
  };

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.content, refreshSlot]}
      refreshControl={
        <AppRefreshControl
          refreshing={summary.status === 'loading' && !!data}
          onRefresh={refresh}
        />
      }
    >
      <View>
        <AppText style={styles.title}>Reports</AppText>
        <AppText color={colors.textSecondary}>Understand every journey</AppText>
      </View>
      <SummaryFilters
        vehicles={vehicles}
        vehicleId={vehicleId}
        onSelectVehicle={setVehicleId}
        preset={preset}
        onSelectPreset={setPreset}
        dateText={dateText}
      />
      {renderBody()}
      <ExportRow
        caption={`Trip summary · ${dateText}`}
        onExport={handleExport}
      />
      <AppButton
        title="All reports"
        variant="link"
        icon="chevron-right"
        isIconRight
        onPress={() =>
          navigation.navigate(routeNames.mainTabs, {
            screen: routeNames.reports,
          })
        }
      />
    </ScrollView>
  );
}
