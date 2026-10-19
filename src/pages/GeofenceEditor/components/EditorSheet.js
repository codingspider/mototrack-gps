// The panel over the bottom of the geofence map. Swipe it up to see the whole form, swipe it down to hide the form
// and draw on a bigger map (the top bar with the hint, undo and clear always stays). Tapping the grip does the same.
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Animated, PanResponder, StyleSheet, TouchableWithoutFeedback, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const DRAG_START = 6; // pixels of vertical movement before the panel takes the gesture
const FLING_MS = 180; // how far ahead (in ms) a fling is projected when choosing where to rest

const makeStyles = (colors) =>
  StyleSheet.create({
    sheet: {
      position: 'absolute',
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: colors.surface,
      borderTopLeftRadius: radius.lg,
      borderTopRightRadius: radius.lg,
      elevation: 12,
      shadowColor: colors.shadow,
      shadowOpacity: 0.2,
      shadowRadius: 10,
      overflow: 'hidden',
    },
    gripArea: { alignItems: 'center', paddingTop: spacing.sm, paddingBottom: spacing.xs, gap: 2 },
    grip: { width: 44, height: 5, borderRadius: radius.round, backgroundColor: colors.border },
    hintRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.xs },
    hintText: { fontWeight: '700' },
    body: { flexShrink: 1 },
  });

/**
 * @param {number} maxHeight The panel is never taller than this (the map keeps the rest)
 * @param {React.ReactNode} bar Always visible under the grip (the drawing hint, undo and clear)
 * @param {React.ReactNode} children The form (hidden when the panel is swiped down)
 * @param {function} onVisibleHeight Called with the pixels of the panel that show once it rests (whole panel when open,
 *   the grip and the bar when hidden), so the map keeps its middle in the part that can be seen
 */
export default function EditorSheet({ maxHeight, bar, children, onVisibleHeight }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const [sheetHeight, setSheetHeight] = useState(0);
  const [topHeight, setTopHeight] = useState(0);
  const [isOpen, setIsOpen] = useState(true);

  // translateY: 0 = open (whole form showing), hiddenOffset = only the grip and the bar showing
  const translateY = useRef(new Animated.Value(0)).current;
  const hiddenOffset = Math.max(0, sheetHeight - topHeight);
  const hiddenOffsetRef = useRef(hiddenOffset);
  hiddenOffsetRef.current = hiddenOffset;
  const isOpenRef = useRef(isOpen);
  isOpenRef.current = isOpen;
  const currentRef = useRef(0);
  const startRef = useRef(0);

  useEffect(() => {
    const id = translateY.addListener(({ value }) => {
      currentRef.current = value;
    });
    return () => translateY.removeListener(id);
  }, [translateY]);

  const snap = (open) => {
    const target = open ? 0 : hiddenOffsetRef.current;
    currentRef.current = target; // where it will rest (a native spring does not report back)
    isOpenRef.current = open;
    setIsOpen(open);
    Animated.spring(translateY, { toValue: target, friction: 9, tension: 70, useNativeDriver: true }).start();
  };
  const snapRef = useRef(snap);
  snapRef.current = snap;

  // The form or the screen changed size (keyboard, a longer hint): stay in the same place
  useEffect(() => {
    const target = isOpenRef.current ? 0 : hiddenOffset;
    currentRef.current = target;
    translateY.setValue(target);
  }, [hiddenOffset, translateY]);

  useEffect(() => {
    if (topHeight > 0 && sheetHeight > 0 && onVisibleHeight) {
      onVisibleHeight(isOpen ? sheetHeight : topHeight);
    }
  }, [isOpen, sheetHeight, topHeight, onVisibleHeight]);

  const panResponder = useMemo(
    () =>
      PanResponder.create({
        // Only clear vertical drags (taken before the grip or a button can keep them): taps still reach the undo /
        // clear buttons on the bar
        onMoveShouldSetPanResponderCapture: (_event, gesture) =>
          Math.abs(gesture.dy) > DRAG_START && Math.abs(gesture.dy) > Math.abs(gesture.dx),
        onPanResponderGrant: () => {
          translateY.stopAnimation();
          startRef.current = currentRef.current;
        },
        onPanResponderMove: (_event, gesture) => {
          const next = Math.min(hiddenOffsetRef.current, Math.max(0, startRef.current + gesture.dy));
          translateY.setValue(next);
        },
        onPanResponderRelease: (_event, gesture) => {
          const moved = Math.min(hiddenOffsetRef.current, Math.max(0, startRef.current + gesture.dy));
          const projected = moved + gesture.vy * FLING_MS; // vy is positive when moving down (hiding)
          snapRef.current(projected < hiddenOffsetRef.current / 2);
        },
        onPanResponderTerminationRequest: () => false,
        onPanResponderTerminate: () => snapRef.current(isOpenRef.current),
      }),
    [translateY],
  );

  return (
    <Animated.View
      style={[styles.sheet, { maxHeight, transform: [{ translateY }] }]}
      onLayout={(event) => setSheetHeight(event.nativeEvent.layout.height)}
    >
      <View {...panResponder.panHandlers} onLayout={(event) => setTopHeight(event.nativeEvent.layout.height)}>
        <TouchableWithoutFeedback
          onPress={() => snap(!isOpen)}
          accessibilityRole="button"
          accessibilityLabel={isOpen ? 'Hide the form' : 'Show the form'}
        >
          <View style={styles.gripArea}>
            <View style={styles.grip} />
            <View style={styles.hintRow}>
              <Icon source={isOpen ? 'chevron-down' : 'chevron-up'} size={18} color={colors.primary} />
              <AppText variant="caption" color={colors.primary} style={styles.hintText}>
                {isOpen ? 'Swipe down for a bigger map' : 'Swipe up for the name, alert and color'}
              </AppText>
            </View>
          </View>
        </TouchableWithoutFeedback>
        {bar}
      </View>
      <View style={styles.body}>{children}</View>
    </Animated.View>
  );
}
