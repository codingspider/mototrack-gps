// The extra top margin a page's content gets while a refresh is running, to leave a clear slot for the running car
// (see RefreshCarHost). Add it to the contentContainerStyle of the page's ScrollView / FlatList.
import { StyleSheet } from 'react-native';
import { useSelector } from 'react-redux';
import { selectIsRefreshing } from '../store/slices/refreshCarSlice';
import { SLOT_HEIGHT } from '../utils/refreshCar';

const styles = StyleSheet.create({
  slot: { marginTop: SLOT_HEIGHT },
});

/** @returns {object|null} A style to add to contentContainerStyle, or null when nothing is refreshing */
export default function useRefreshSlotStyle() {
  const isRefreshing = useSelector(selectIsRefreshing);
  return isRefreshing ? styles.slot : null;
}
