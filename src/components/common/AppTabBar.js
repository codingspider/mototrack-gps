// Floating bottom bar: inactive tabs are grouped in orange pills, the active tab is a separate circle
// that sits at the position of the active tab (so it moves when you change tab).
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const ITEM_SIZE = 60;
const ICON_SIZE = 22;

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: spacing.sm,
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    pill: {
      flexDirection: 'row',
      padding: spacing.xs,
      borderRadius: radius.round,
      backgroundColor: colors.primary,
      elevation: 6,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    item: { flex: 1, height: ITEM_SIZE, alignItems: 'center', justifyContent: 'center' },
    activeCircle: {
      width: ITEM_SIZE + spacing.sm,
      height: ITEM_SIZE + spacing.sm,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 6,
      shadowColor: colors.primary,
      shadowOpacity: 0.3,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 4 },
    },
    label: { fontSize: 10, fontWeight: '700', marginTop: 2 },
  });

export default function AppTabBar({ state, descriptors, navigation }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();

  const renderTab = (route, isFocused) => {
    const { options } = descriptors[route.key];
    // Active: primary icon + text on the round surface. Inactive: white on the orange pill.
    const contentColor = isFocused ? colors.primary : colors.textOnPrimary;

    const handlePress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        navigation.navigate(route.name, route.params);
      }
    };

    return (
      <Pressable
        key={route.key}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected: isFocused }}
        accessibilityLabel={options.tabBarLabel}
        style={isFocused ? styles.activeCircle : styles.item}
      >
        {options.tabBarIcon({ focused: isFocused, color: contentColor, size: ICON_SIZE })}
        <AppText variant="caption" color={contentColor} style={styles.label} numberOfLines={1}>
          {options.tabBarLabel}
        </AppText>
      </Pressable>
    );
  };

  // Tabs before the active one form the left pill, tabs after it form the right pill.
  const tabsBefore = state.routes.slice(0, state.index);
  const tabsAfter = state.routes.slice(state.index + 1);

  const renderPill = (routes) => {
    if (routes.length === 0) {
      return null;
    }
    return (
      <View style={[styles.pill, { flex: routes.length }]}>{routes.map((route) => renderTab(route, false))}</View>
    );
  };

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom + spacing.sm }]}>
      {renderPill(tabsBefore)}
      {renderTab(state.routes[state.index], true)}
      {renderPill(tabsAfter)}
    </View>
  );
}
