// Bottom tab bar from the design: primary-colored bar, the active tab is a raised circle.
import React from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from './AppText';
import { colors, radius, spacing } from '../../theme';

const CIRCLE_SIZE = 52;
const ICON_SIZE = 24;

export default function AppTabBar({ state, descriptors, navigation }) {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.bar, { paddingBottom: insets.bottom }]}>
      {state.routes.map((route, index) => {
        const isFocused = state.index === index;
        const { options } = descriptors[route.key];

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
            style={styles.item}
          >
            {isFocused ? (
              <View style={styles.activeCircle}>
                {options.tabBarIcon({ focused: true, color: colors.textOnPrimary, size: ICON_SIZE })}
              </View>
            ) : (
              <>
                {options.tabBarIcon({ focused: false, color: colors.textOnPrimary, size: ICON_SIZE })}
                <AppText variant="caption" color={colors.textOnPrimary} style={styles.label}>
                  {options.tabBarLabel}
                </AppText>
              </>
            )}
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  bar: {
    flexDirection: 'row',
    backgroundColor: colors.primary,
    paddingTop: spacing.md,
    minHeight: 72,
  },
  item: { flex: 1, alignItems: 'center', gap: spacing.xs },
  label: { fontWeight: '700' },
  activeCircle: {
    width: CIRCLE_SIZE,
    height: CIRCLE_SIZE,
    marginTop: -(spacing.xl + spacing.sm),
    borderRadius: radius.round,
    backgroundColor: colors.primary,
    borderWidth: 5,
    borderColor: colors.background,
    alignItems: 'center',
    justifyContent: 'center',
    elevation: 4,
    shadowColor: colors.primary,
    shadowOpacity: 0.35,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
});
