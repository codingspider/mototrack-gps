// Home screen: header, sliders, status grid, pay card and recent activities. All data comes from Redux.
import React, { useEffect } from 'react';
import { RefreshControl, ScrollView, View } from 'react-native';
import { useDispatch } from 'react-redux';
import useVehicles from '../../hooks/useVehicles';
import { fetchProfile } from '../../store/slices/profileSlice';
import { fetchSliders } from '../../store/slices/appSlice';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import DashboardSkeleton from './DashboardSkeleton';
import GreetingHeader from './components/GreetingHeader';
import SliderBanner from './components/SliderBanner';
import CountTiles from './components/CountTiles';
import PayCard from './components/PayCard';
import RecentActivities from './components/RecentActivities';
import { useThemedStyles } from '../../theme';
import makeStyles from './DashboardPage.styles';

export default function DashboardPage() {
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const { vehicles, isLoading, error, refresh } = useVehicles();

  // Each loads only if missing or stale (see condition in the thunks)
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSliders());
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchProfile({ force: true }));
    dispatch(fetchSliders({ force: true }));
    refresh();
  };

  if (isLoading && vehicles.length === 0) {
    return <DashboardSkeleton />;
  }
  if (error && vehicles.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }
  if (vehicles.length === 0) {
    return <EmptyState text="No vehicles found" />;
  }

  return (
    <View style={styles.screen}>
      <GreetingHeader />
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refreshAll} />}
      >
        <SliderBanner />
        <CountTiles />
        <PayCard />
        <RecentActivities />
      </ScrollView>
    </View>
  );
}
