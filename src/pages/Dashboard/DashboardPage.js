// Home screen: header, sliders, status grid, pay card and recent activities. All data comes from Redux.
import React, { useEffect } from 'react';
import { ScrollView, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useDispatch } from 'react-redux';
import useVehicles from '../../hooks/useVehicles';
import { fetchProfile } from '../../store/slices/profileSlice';
import { fetchSliders } from '../../store/slices/appSlice';
import { fetchRecentMoves } from '../../store/slices/vehiclesSlice';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import DashboardSkeleton from './DashboardSkeleton';
import GreetingHeader from './components/GreetingHeader';
import SliderBanner from './components/SliderBanner';
import CountTiles from './components/CountTiles';
import PayCard from './components/PayCard';
import RecentActivities from './components/RecentActivities';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import { useThemedStyles } from '../../theme';
import makeStyles from './DashboardPage.styles';
import { useTranslation } from '../../i18n/LanguageContext';

export default function DashboardPage() {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const styles = useThemedStyles(makeStyles);
  const tabBarSpace = useTabBarSpace();
  const { vehicles, isLoading, error, refresh } = useVehicles();
  const { t } = useTranslation();

  // Each loads only if missing or stale (see condition in the thunks)
  useEffect(() => {
    dispatch(fetchProfile());
    dispatch(fetchSliders());
  }, [dispatch]);

  const refreshAll = () => {
    dispatch(fetchProfile({ force: true }));
    dispatch(fetchSliders({ force: true }));
    dispatch(fetchRecentMoves({ force: true }));
    refresh();
  };

  if (isLoading && vehicles.length === 0) {
    return <DashboardSkeleton />;
  }
  if (error && vehicles.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }
  if (vehicles.length === 0) {
    return <EmptyState text={t('common.noVehiclesFound')} />;
  }

  return (
    <View style={styles.screen}>
      <GreetingHeader />
      <ScrollView
        style={styles.list}
        contentContainerStyle={[[styles.content, { paddingBottom: tabBarSpace }], refreshSlot]}
        refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refreshAll} placement="home" />}
      >
        <SliderBanner />
        <CountTiles />
        <PayCard />
        <RecentActivities />
      </ScrollView>
    </View>
  );
}
