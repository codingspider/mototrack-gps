// The customer's vehicles: search by name or plate, filter by status, tap one to open its details.
// Data comes from Redux (the same list as Home and the Live map, kept live by the socket).
import React, { useCallback, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { fetchVehicleDetails } from '../../store/slices/vehiclesSlice';
import { renderBackToHomeButton } from '../../components/common/BackToHomeButton';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import FilterChips from '../../components/common/FilterChips';
import VehicleRow from '../../components/vehicle/VehicleRow';
import useTabBarSpace from '../../hooks/useTabBarSpace';
import useVehicles from '../../hooks/useVehicles';
import routeNames from '../../routes/routeNames';
import { STATUS_FILTERS, countByFilter, filterVehicles } from '../../utils/vehicleFilter';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';
import VehiclesSkeleton from './VehiclesSkeleton';
import { useTranslation } from '../../i18n/LanguageContext';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    search: {
      margin: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      color: colors.text,
    },
    chips: { paddingBottom: spacing.sm },
    list: { padding: spacing.md, paddingTop: spacing.xs },
  });

// A row counts as seen when half of it is on screen
const VIEWABILITY = { itemVisiblePercentThreshold: 50 };

export default function VehiclesPage({ route }) {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const tabBarSpace = useTabBarSpace();
  const styles = useThemedStyles(makeStyles);
  const { vehicles, isLoading, error, refresh } = useVehicles();
  const [query, setQuery] = useState('');
  const [filterKey, setFilterKey] = useState('all');

  // Back arrow in the header: back to Home
  useLayoutEffect(() => {
    navigation.setOptions({ headerLeft: renderBackToHomeButton });
  }, [navigation]);

  // The rows on screen show today's and the total distance, which only the vehicle details have.
  // Load them for the visible rows only (each is skipped when it was loaded a moment ago).
  const handleViewableChange = useRef(({ viewableItems }) => {
    viewableItems.forEach((entry) => dispatch(fetchVehicleDetails({ id: entry.item.id })));
  }).current;

  // Home tiles open this list with a status filter (route params). Opening the tab directly shows everything:
  // the filter is cleared again when the screen loses focus.
  const requestedFilter = route.params?.filter;
  useFocusEffect(
    useCallback(() => {
      if (requestedFilter) {
        setFilterKey(requestedFilter);
        setQuery('');
      }
      return () => {
        setFilterKey('all');
        setQuery('');
        navigation.setParams({ filter: undefined });
      };
    }, [navigation, requestedFilter]),
  );

  const counts = useMemo(() => countByFilter(vehicles), [vehicles]);
  const visible = useMemo(() => filterVehicles(vehicles, filterKey, query), [vehicles, filterKey, query]);
  // Only the id goes in the params; the details page reads the live vehicle from Redux
  const openDetails = useCallback((id) => navigation.navigate(routeNames.vehicleDetails, { id }), [navigation]);
  const renderItem = useCallback(({ item }) => <VehicleRow vehicle={item} onPress={openDetails} />, [openDetails]);

  if (isLoading && vehicles.length === 0) {
    return <VehiclesSkeleton />;
  }
  if (error && vehicles.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  return (
    <View style={styles.screen}>
      <TextInput
        value={query}
        onChangeText={setQuery}
        placeholder={t('vehicles.search')}
        placeholderTextColor={colors.textSecondary}
        style={styles.search}
        autoCorrect={false}
      />
      <View style={styles.chips}>
        <FilterChips filters={STATUS_FILTERS} selectedKey={filterKey} counts={counts} onSelect={setFilterKey} />
      </View>
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[[styles.list, { paddingBottom: tabBarSpace }], refreshSlot]}
        keyboardShouldPersistTaps="handled"
        onViewableItemsChanged={handleViewableChange}
        viewabilityConfig={VIEWABILITY}
        ListEmptyComponent={<EmptyState text={vehicles.length === 0 ? t('vehicles.none') : t('vehicles.noMatch')} />}
        refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
      />
    </View>
  );
}
