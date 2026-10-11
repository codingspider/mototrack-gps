// The bottom sheet of the vehicle details page. Swipe it up to read all the details, swipe it down to
// hide it and see the map full screen. It rests in three places: hidden (only the grip shows), middle
// (the summary card and the action row) and full (everything, scrolls).
import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Animated,
  BackHandler,
  PanResponder,
  ScrollView,
  StyleSheet,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { Icon, IconButton } from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const GRIP_AREA = 26; // height of the grip strip that is always visible
const HINT_ROW = 30; // the "Swipe up for details" line under the grip (visible when hidden and in the middle)
const FULL_SHARE = 0.92; // the full sheet covers this share of the page (the top of the map stays in view)
const FALLBACK_MIDDLE = 280; // used until the header has been measured
const DRAG_START = 6; // pixels of vertical movement before the sheet takes the gesture
const FLING_MS = 180; // how far ahead (in ms) a fling is projected when choosing where to rest

const makeStyles = colors =>
  StyleSheet.create({
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.background,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      elevation: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      overflow: 'hidden',
    },
    gripArea: {
      height: GRIP_AREA,
      alignItems: 'center',
      justifyContent: 'center',
    },
    // On the swipe row, over the grip and the hint, at the left and right ends
    switchRow: {
      position: 'absolute',
      top: GRIP_AREA - 6,
      left: spacing.md,
      right: spacing.md,
      flexDirection: 'row',
      justifyContent: 'space-between',
    },
    // A solid white button with a thin border and a soft shadow, so it stands out from the sheet
    switchButton: {
      margin: 0,
      borderWidth: 1,
      borderColor: colors.border,
      elevation: 3,
      shadowColor: colors.shadow,
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
    },
    hintRow: {
      height: HINT_ROW,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
    },
    hintText: { fontWeight: '700' },
    grip: {
      width: 44,
      height: 5,
      borderRadius: radius.round,
      backgroundColor: colors.border,
    },
    list: { flex: 1 },
    content: {
      paddingHorizontal: spacing.sm,
      paddingBottom: spacing.xxl,
      gap: spacing.sm,
    },
  });

/**
 * @param {number} pageHeight Height of the visible page (the sheet is sized from it)
 * @param {Animated.Value} visibleHeight Kept up to date with how many pixels of the sheet are showing (the page uses
 *   it to lift the map buttons above the sheet)
 * @param {React.ReactNode} header The summary card and the action row (what shows in the middle position)
 * @param {React.ReactNode} children The detail cards (shown when swiped up)
 * @param {function} onExpand Called when the sheet opens fully
 * @param {function} onPreviousVehicle Left arrow on the swipe row: show the previous vehicle
 * @param {function} onNextVehicle Right arrow on the swipe row: show the next vehicle
 */
export default function DetailsSheet({
  pageHeight,
  visibleHeight,
  header,
  children,
  onExpand,
  onPreviousVehicle,
  onNextVehicle,
}) {
  const styles = useThemedStyles(makeStyles);
  const { colors } = useAppTheme();
  const insets = useSafeAreaInsets();
  const fullHeight = Math.round(pageHeight * FULL_SHARE);
  // translateY = full height - visible pixels (so the sheet slides down as fewer pixels show)
  const fullHeightValue = useRef(new Animated.Value(fullHeight)).current;
  useEffect(() => {
    fullHeightValue.setValue(fullHeight);
  }, [fullHeight, fullHeightValue]);
  const translateY = useMemo(
    () => Animated.subtract(fullHeightValue, visibleHeight),
    [fullHeightValue, visibleHeight],
  );
  const [headerHeight, setHeaderHeight] = useState(0);
  const [isExpanded, setIsExpanded] = useState(false);
  // True once the list has been scrolled down. Only then does the list scroll natively; at the top the sheet handles
  // the drag itself (Android's native scroll view would grab a pull-down before the sheet could close).
  const [isScrolled, setIsScrolled] = useState(false);
  const isScrolledRef = useRef(false);
  const scrollRef = useRef(null);
  const topBar = GRIP_AREA + HINT_ROW;
  const middleVisible =
    headerHeight > 0 ? topBar + headerHeight : FALLBACK_MIDDLE;
  // Hidden: the grip and the hint stay on screen, above the phone's gesture bar
  const hiddenVisible = topBar + insets.bottom + spacing.xs;

  // The pan responder is created once, so it reads the latest numbers from refs
  const pointsRef = useRef({
    hidden: hiddenVisible,
    middle: middleVisible,
    full: fullHeight,
  });
  pointsRef.current = {
    hidden: hiddenVisible,
    middle: middleVisible,
    full: fullHeight,
  };

  // The hint fades out as the sheet opens past the middle
  const hintOpacity = useMemo(
    () =>
      visibleHeight.interpolate({
        inputRange: [middleVisible, middleVisible + 90],
        outputRange: [1, 0],
        extrapolate: 'clamp',
      }),
    [visibleHeight, middleVisible],
  );
  // The cards fade out as the sheet is hidden, so only the grip and the hint are left
  const contentOpacity = useMemo(
    () =>
      visibleHeight.interpolate({
        inputRange: [hiddenVisible, hiddenVisible + 50],
        outputRange: [0, 1],
        extrapolate: 'clamp',
      }),
    [visibleHeight, hiddenVisible],
  );
  // The arrow bobs up and down a little to catch the eye
  const bob = useRef(new Animated.Value(0)).current;
  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(bob, {
          toValue: -4,
          duration: 600,
          useNativeDriver: true,
        }),
        Animated.timing(bob, {
          toValue: 0,
          duration: 600,
          useNativeDriver: true,
        }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [bob]);
  const snapRef = useRef('middle'); // 'hidden' | 'middle' | 'full'
  const currentRef = useRef(middleVisible); // pixels showing right now
  const startRef = useRef(0);
  const preDragRef = useRef(0); // movement before the sheet took over the gesture (the responder forgets it)
  const scrollYRef = useRef(0);
  const onExpandRef = useRef(onExpand);
  onExpandRef.current = onExpand;

  useEffect(() => {
    const id = visibleHeight.addListener(({ value }) => {
      currentRef.current = value;
    });
    return () => visibleHeight.removeListener(id);
  }, [visibleHeight]);

  const snapTo = useCallback(
    name => {
      snapRef.current = name;
      if (name !== 'full') {
        scrollRef.current?.scrollTo({ y: 0, animated: false });
      }
      currentRef.current = pointsRef.current[name]; // where it will rest (a native spring does not report back)
      setIsExpanded(name === 'full');
      if (name === 'full') {
        onExpandRef.current?.();
      }
      Animated.spring(visibleHeight, {
        toValue: pointsRef.current[name],
        friction: 9,
        tension: 70,
        useNativeDriver: true,
      }).start();
    },
    [visibleHeight],
  );

  // Put the sheet in the middle once the header is measured, and keep it on its resting place when sizes change
  const hasPlacedRef = useRef(false);
  useEffect(() => {
    if (!hasPlacedRef.current) {
      hasPlacedRef.current = true;
      visibleHeight.setValue(pointsRef.current.middle);
      currentRef.current = pointsRef.current.middle;
      return;
    }
    currentRef.current = pointsRef.current[snapRef.current];
    Animated.spring(visibleHeight, {
      toValue: pointsRef.current[snapRef.current],
      friction: 9,
      tension: 70,
      useNativeDriver: true,
    }).start();
  }, [middleVisible, fullHeight, visibleHeight]);

  // The phone's Back button brings a full sheet back to the middle first
  useEffect(() => {
    if (!isExpanded) {
      return undefined;
    }
    const subscription = BackHandler.addEventListener(
      'hardwareBackPress',
      () => {
        snapTo('middle');
        return true;
      },
    );
    return () => subscription.remove();
  }, [isExpanded, snapTo]);

  const panResponder = useRef(
    PanResponder.create({
      // Take vertical drags. When the sheet is full and the list is scrolled down, leave them to the list;
      // pulling down from the very top of the list closes the sheet instead.
      onMoveShouldSetPanResponderCapture: (_event, gesture) => {
        const isVertical =
          Math.abs(gesture.dy) > DRAG_START &&
          Math.abs(gesture.dy) > Math.abs(gesture.dx);
        if (!isVertical) {
          return false;
        }
        const isTakingOver =
          snapRef.current === 'full' ? !isScrolledRef.current : true;
        if (isTakingOver) {
          preDragRef.current = gesture.dy;
        }
        return isTakingOver;
      },
      onPanResponderGrant: () => {
        startRef.current = currentRef.current;
      },
      onPanResponderMove: (_event, gesture) => {
        const { hidden, full } = pointsRef.current;
        const moved = gesture.dy + preDragRef.current; // positive = finger moving down
        if (snapRef.current === 'full' && moved < 0) {
          // Full sheet, list at the top, finger moving up: scroll the list by hand for this first drag
          scrollRef.current?.scrollTo({ y: -moved, animated: false });
          return;
        }
        const next = Math.min(full, Math.max(hidden, startRef.current - moved));
        visibleHeight.setValue(next);
      },
      onPanResponderRelease: (_event, gesture) => {
        const points = pointsRef.current;
        if (snapRef.current === 'full' && gesture.dy + preDragRef.current < 0) {
          return; // it was a scroll, the sheet stays full
        }
        // vy is positive when moving down, which makes the sheet smaller
        const shown = Math.min(
          points.full,
          Math.max(
            points.hidden,
            startRef.current - gesture.dy - preDragRef.current,
          ),
        );
        const projected = shown - gesture.vy * FLING_MS;
        const names = ['hidden', 'middle', 'full'];
        let best = 'middle';
        names.forEach(name => {
          if (
            Math.abs(points[name] - projected) <
            Math.abs(points[best] - projected)
          ) {
            best = name;
          }
        });
        snapTo(best);
      },
    }),
  ).current;

  // Tapping the grip or the hint: hidden -> middle, middle -> full, full -> middle
  const toggleFromGrip = () => {
    const order = { hidden: 'middle', middle: 'full', full: 'middle' };
    snapTo(order[snapRef.current]);
  };

  return (
    <Animated.View
      style={[
        styles.sheet,
        { height: fullHeight, transform: [{ translateY }] },
      ]}
      {...panResponder.panHandlers}
    >
      <TouchableWithoutFeedback onPress={toggleFromGrip}>
        <View>
          <View style={styles.gripArea}>
            <View style={styles.grip} />
          </View>
          <Animated.View style={[styles.hintRow, { opacity: hintOpacity }]}>
            <Animated.View style={{ transform: [{ translateY: bob }] }}>
              <Icon source="chevron-up" size={20} color={colors.primary} />
            </Animated.View>
            <AppText
              variant="caption"
              color={colors.primary}
              style={styles.hintText}
            >
              Swipe up for details
            </AppText>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
      {/* The vehicle switch sits on the swipe row, at its left and right ends */}
      <Animated.View style={[styles.switchRow, { opacity: hintOpacity }]} pointerEvents="box-none">
        <IconButton
          icon="arrow-left"
          size={20}
          iconColor={colors.primary}
          containerColor={colors.surface}
          style={styles.switchButton}
          onPress={onPreviousVehicle}
          accessibilityLabel="Previous vehicle"
        />
        <IconButton
          icon="arrow-right"
          size={20}
          iconColor={colors.primary}
          containerColor={colors.surface}
          style={styles.switchButton}
          onPress={onNextVehicle}
          accessibilityLabel="Next vehicle"
        />
      </Animated.View>
      <Animated.View style={[styles.list, { opacity: contentOpacity }]}>
        <ScrollView
          ref={scrollRef}
          style={styles.list}
          contentContainerStyle={styles.content}
          scrollEnabled={isExpanded && isScrolled}
          scrollEventThrottle={16}
          onScroll={event => {
            const offset = event.nativeEvent.contentOffset.y;
            scrollYRef.current = offset;
            const scrolled = offset > 1;
            if (scrolled !== isScrolledRef.current) {
              isScrolledRef.current = scrolled;
              setIsScrolled(scrolled);
            }
          }}
          showsVerticalScrollIndicator={isExpanded}
        >
          <View
            onLayout={event => setHeaderHeight(event.nativeEvent.layout.height)}
          >
            {header}
          </View>
          {children}
        </ScrollView>
      </Animated.View>
    </Animated.View>
  );
}
