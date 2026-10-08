// Playback history of one vehicle: pick a date and time range, then replay the route on the map with play,
// speed and skip-stops, and read the trip numbers and timeline. The route comes from Redux.
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import { useDispatch, useSelector } from 'react-redux';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import usePlayback from '../../hooks/usePlayback';
import { fetchPlayback, selectPlayback } from '../../store/slices/playbackSlice';
import { showToast } from '../../store/slices/toastSlice';
import { selectVehicleById } from '../../store/slices/vehiclesSlice';
import { getPresetRange, isRangeBackwards } from '../../utils/playbackRange';
import { buildTimeline, positionAt, summarizeTrip } from '../../utils/playbackStats';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import JourneyTimeline from './components/JourneyTimeline';
import PlaybackControls from './components/PlaybackControls';
import PlaybackFilters from './components/PlaybackFilters';
import PlaybackMap from './components/PlaybackMap';
import PlaybackStats from './components/PlaybackStats';
import RangePicker from './components/RangePicker';
import PlaybackSkeleton from './PlaybackSkeleton';

const MAP_SHARE = 0.36; // share of the page the map takes (the filters sit above it)

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    panel: { flex: 1, backgroundColor: colors.surface, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
    panelContent: { padding: spacing.lg, gap: spacing.lg, paddingBottom: spacing.xxl },
    fab: { position: 'absolute', bottom: spacing.xl, alignSelf: 'center', margin: 0, backgroundColor: colors.primary, elevation: 6 },
  });

export default function PlaybackPage({ route, navigation }) {
  const { id } = route.params;
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(id));
  const { points, status, error, truncated } = useSelector(selectPlayback);

  // A report (Trips) can open Playback with the exact time range of a trip
  const startRange = route.params.range;
  const [preset, setPreset] = useState(startRange ? 'custom' : 'today');
  const [range, setRange] = useState(() => startRange || getPresetRange('today'));
  const [isPickerOpen, setIsPickerOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [pageHeight, setPageHeight] = useState(600);

  const loadRoute = (force) => dispatch(fetchPlayback({ deviceId: id, ...range, force }));

  // Loads when the page opens and whenever the range changes (skipped if the same range is fresh)
  useEffect(() => {
    dispatch(fetchPlayback({ deviceId: id, ...range }));
  }, [dispatch, id, range]);

  useEffect(() => {
    navigation.setOptions({ title: 'Playback' });
  }, [navigation]);

  useEffect(() => {
    if (status === 'succeeded' && truncated) {
      dispatch(showToast({ type: 'warning', message: 'Too many points for this range. Showing the first part: pick a shorter time.' }));
    }
  }, [status, truncated, dispatch]);

  const summary = useMemo(() => summarizeTrip(points), [points]);
  const timeline = useMemo(() => buildTimeline(points, summary.stops), [points, summary.stops]);
  const player = usePlayback(summary.startTime, summary.endTime, summary.stops);
  const position = useMemo(() => positionAt(points, player.playTime), [points, player.playTime]);

  const handlePreset = (nextPreset) => {
    setPreset(nextPreset);
    setRange(getPresetRange(nextPreset));
  };

  const handleCustomRange = (nextRange) => {
    setIsPickerOpen(false);
    if (isRangeBackwards(nextRange)) {
      dispatch(showToast({ type: 'warning', message: 'The end must be after the start' }));
      return;
    }
    setPreset('custom');
    setRange(nextRange);
  };

  // The server cannot make a playback video yet (see CLAUDE.md), so for now we only say so.
  const handleDownload = () => dispatch(showToast({ type: 'info', message: 'Video download is coming soon' }));

  if (!vehicle) {
    return <EmptyState text="Vehicle not found" />;
  }

  const hasRoute = points.length > 1;
  const mapHeight = Math.round(pageHeight * MAP_SHARE);

  if (isFullscreen) {
    return (
      <View style={styles.screen}>
        <PlaybackMap vehicle={vehicle} points={points} stops={summary.stops} position={position} isFullscreen onToggleFullscreen={() => setIsFullscreen(false)} height={mapHeight} />
        {hasRoute && (
          <IconButton icon={player.isPlaying ? 'pause' : 'play'} size={36} iconColor={colors.textOnPrimary} style={styles.fab} onPress={player.toggle} accessibilityLabel={player.isPlaying ? 'Pause' : 'Play'} />
        )}
      </View>
    );
  }

  let body = null;
  if (status === 'loading' || status === 'idle') {
    body = <PlaybackSkeleton />;
  } else if (status === 'failed') {
    body = <ErrorState message={error} onRetry={() => loadRoute(true)} />;
  } else if (!hasRoute) {
    body = <EmptyState text="No route recorded for this time. Try another date or time." />;
  } else {
    body = (
      <ScrollView style={styles.panel} contentContainerStyle={styles.panelContent}>
        <PlaybackControls
          player={player}
          playTime={player.playTime}
          currentSpeed={position ? position.speed : 0}
          startTime={summary.startTime}
          endTime={summary.endTime}
          onDownload={handleDownload}
        />
        <PlaybackStats summary={summary} />
        <JourneyTimeline items={timeline} />
      </ScrollView>
    );
  }

  return (
    <View style={styles.screen} onLayout={(event) => setPageHeight(event.nativeEvent.layout.height)}>
      <PlaybackFilters vehicle={vehicle} preset={preset} range={range} onPreset={handlePreset} onCustom={() => setIsPickerOpen(true)} />
      <PlaybackMap vehicle={vehicle} points={points} stops={summary.stops} position={position} isFullscreen={false} onToggleFullscreen={() => setIsFullscreen(true)} height={mapHeight} />
      {body}
      <RangePicker visible={isPickerOpen} range={range} onConfirm={handleCustomRange} onDismiss={() => setIsPickerOpen(false)} />
    </View>
  );
}
