// How much room the floating bottom tab bar takes, so the last item of a scrolling tab screen is not hidden under it.
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TAB_BAR_HEIGHT } from '../components/common/AppTabBar';
import { spacing } from '../theme';

/** @returns {number} Padding to add at the bottom of a scrolling list or page */
export default function useTabBarSpace() {
  const insets = useSafeAreaInsets();
  return TAB_BAR_HEIGHT + insets.bottom + spacing.sm + spacing.md;
}
