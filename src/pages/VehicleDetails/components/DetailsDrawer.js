// Drawer that slides up from the bottom and covers only the lower half of the page (the map stays visible).
// It holds the detail cards: live status, location, distance, vehicle & device.
import React, { useEffect, useRef } from 'react';
import { Animated, BackHandler, PanResponder, RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { IconButton } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import ErrorState from '../../../components/common/ErrorState';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import VehicleDetailsSkeleton from '../VehicleDetailsSkeleton';
import DetailSection from './DetailSection';

const SLIDE_MS = 250;
const SWIPE_DOWN_TO_CLOSE = 60; // pixels

const makeStyles = (colors) =>
  StyleSheet.create({
    drawer: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      elevation: 12,
      shadowColor: colors.shadow,
      overflow: 'hidden',
    },
    header: { alignItems: 'center', paddingTop: spacing.sm, backgroundColor: colors.surface },
    grip: { width: 40, height: 4, borderRadius: radius.round, backgroundColor: colors.border },
    titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', alignSelf: 'stretch', paddingLeft: spacing.lg },
    list: { flex: 1 },
    content: { padding: spacing.sm, gap: spacing.sm },
  });

/**
 * @param {boolean} visible Drawer is open
 * @param {function} onClose
 * @param {number} height Height of the drawer (the bottom half of the page)
 * @param {Array} sections Rows to show, from buildVehicleSections
 * @param {boolean} isLoading Details are loading for the first time
 * @param {string|null} error Message when loading failed
 * @param {boolean} isRefreshing Pull-to-refresh spinner
 * @param {function} onRefresh Pull-to-refresh and Retry
 */
export default function DetailsDrawer({ visible, onClose, height, sections, isLoading, error, isRefreshing, onRefresh }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const translateY = useRef(new Animated.Value(height)).current;
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  // Slide up when opened, down when closed
  useEffect(() => {
    Animated.timing(translateY, { toValue: visible ? 0 : height, duration: SLIDE_MS, useNativeDriver: true }).start();
  }, [visible, height, translateY]);

  // The phone's Back button closes the drawer first
  useEffect(() => {
    if (!visible) {
      return undefined;
    }
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      onCloseRef.current();
      return true;
    });
    return () => subscription.remove();
  }, [visible]);

  // Swiping the header down closes the drawer
  const headerPan = useRef(
    PanResponder.create({
      onMoveShouldSetPanResponder: (_event, gesture) => gesture.dy > 8,
      onPanResponderRelease: (_event, gesture) => {
        if (gesture.dy > SWIPE_DOWN_TO_CLOSE) {
          onCloseRef.current();
        }
      },
    }),
  ).current;

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[styles.drawer, { height, transform: [{ translateY }] }]}
    >
      <View style={styles.header} {...headerPan.panHandlers}>
        <View style={styles.grip} />
        <View style={styles.titleRow}>
          <AppText variant="subtitle">Vehicle details</AppText>
          <IconButton icon="chevron-down" iconColor={colors.primary} onPress={onClose} accessibilityLabel="Close details" />
        </View>
      </View>
      <ScrollView
        style={styles.list}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} />}
      >
        {isLoading && <VehicleDetailsSkeleton />}
        {!!error && <ErrorState message={error} onRetry={onRefresh} />}
        {sections.map((section) => (
          <DetailSection key={section.key} title={section.title} icon={section.icon} rows={section.rows} />
        ))}
      </ScrollView>
    </Animated.View>
  );
}
