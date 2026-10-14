// Floating bottom bar: inactive tabs are grouped in orange pills, the active tab is a separate circle
// that sits at the position of the active tab (so it moves when you change tab).
// Changing tab animates: the pills slide to their new size and the circle pops up and floats a little above the bar.
import React, { useEffect, useRef } from 'react';
import { Animated, LayoutAnimation, Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const ITEM_SIZE = 46;
const CIRCLE_SIZE = ITEM_SIZE + spacing.sm; // a little bigger than the items
const FLOAT_HEIGHT = 8; // how far the active circle rises above the pills
const ICON_SIZE = 20;

/** Height of the bar without the phone's bottom inset: every tab screen keeps its last item clear of it. */
export const TAB_BAR_HEIGHT = FLOAT_HEIGHT + spacing.xs + CIRCLE_SIZE + spacing.sm;

const makeStyles = (colors) =>
  StyleSheet.create({
    container: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingTop: FLOAT_HEIGHT + spacing.xs, // room for the floating circle
      gap: spacing.sm,
      backgroundColor: colors.background,
    },
    // The bar floats over the screen: no background of its own, and the gaps let touches through
    containerOverlay: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'transparent',
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
      width: CIRCLE_SIZE,
      height: CIRCLE_SIZE,
      borderRadius: radius.round,
      backgroundColor: colors.surface,
      borderWidth: 2,
      borderColor: colors.primary,
      alignItems: 'center',
      justifyContent: 'center',
      elevation: 8,
      shadowColor: colors.primary,
      shadowOpacity: 0.35,
      shadowRadius: 10,
      shadowOffset: { width: 0, height: 5 },
    },
    label: { fontSize: 10, fontWeight: '700', marginTop: 1 },
    badge: {
      position: 'absolute',
      top: -4,
      right: -10,
      minWidth: 18,
      height: 18,
      paddingHorizontal: 4,
      borderRadius: 9,
      alignItems: 'center',
      justifyContent: 'center',
    },
    badgeText: { fontSize: 10, fontWeight: '800', lineHeight: 12 },
  });

export default function AppTabBar({ state, descriptors, navigation }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const insets = useSafeAreaInsets();
  const float = useRef(new Animated.Value(0)).current; // 0 = pressed down, 1 = floating
  const hasMountedRef = useRef(false);

  // Every time the active tab changes the circle drops in and springs up to float above the bar
  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      float.setValue(1);
      return;
    }
    float.setValue(0);
    Animated.spring(float, { toValue: 1, friction: 5, tension: 90, useNativeDriver: true }).start();
  }, [state.index, float]);

  const circleStyle = {
    transform: [
      { translateY: float.interpolate({ inputRange: [0, 1], outputRange: [FLOAT_HEIGHT, -FLOAT_HEIGHT / 2] }) },
      { scale: float.interpolate({ inputRange: [0, 1], outputRange: [0.7, 1] }) },
    ],
  };

  const renderTab = (route, isFocused) => {
    const { options } = descriptors[route.key];
    // Active: primary icon + text on the round surface. Inactive: white on the orange pill.
    const contentColor = isFocused ? colors.primary : colors.textOnPrimary;

    const handlePress = () => {
      const event = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
      if (!isFocused && !event.defaultPrevented) {
        // The pills change size with the active tab: let that change slide instead of jump
        LayoutAnimation.configureNext(LayoutAnimation.create(260, 'easeInEaseOut', 'opacity'));
        navigation.navigate(route.name, route.params);
      }
    };

    // A number on the icon (new alerts). The open tab never shows it: the customer is looking at them
    const badge = !isFocused && options.tabBarBadge ? options.tabBarBadge : null;
    const badgeText = badge && Number(badge) > 99 ? '99+' : badge;

    const content = (
      <>
        <View>
          {options.tabBarIcon({ focused: isFocused, color: contentColor, size: ICON_SIZE })}
          {!!badgeText && (
            <View style={[styles.badge, { backgroundColor: colors.textOnPrimary }]}>
              <AppText variant="caption" color={colors.secondary} style={styles.badgeText} numberOfLines={1}>
                {badgeText}
              </AppText>
            </View>
          )}
        </View>
        <AppText variant="caption" color={contentColor} style={styles.label} numberOfLines={1}>
          {options.tabBarLabel}
        </AppText>
      </>
    );

    if (isFocused) {
      return (
        <Animated.View key={route.key} style={circleStyle}>
          <Pressable
            onPress={handlePress}
            accessibilityRole="button"
            accessibilityState={{ selected: true }}
            accessibilityLabel={options.tabBarLabel}
            style={styles.activeCircle}
          >
            {content}
          </Pressable>
        </Animated.View>
      );
    }

    return (
      <Pressable
        key={route.key}
        onPress={handlePress}
        accessibilityRole="button"
        accessibilityState={{ selected: false }}
        accessibilityLabel={options.tabBarLabel}
        style={styles.item}
      >
        {content}
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
    <View
      pointerEvents="box-none"
      style={[styles.container, styles.containerOverlay, { paddingBottom: insets.bottom + spacing.sm }]}
    >
      {renderPill(tabsBefore)}
      {renderTab(state.routes[state.index], true)}
      {renderPill(tabsAfter)}
    </View>
  );
}
