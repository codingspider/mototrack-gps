// The trip progress line: tap or drag the dot to jump to any moment.
import React, { useMemo, useRef, useState } from 'react';
import { PanResponder, StyleSheet, View } from 'react-native';
import { radius, useThemedStyles } from '../../../theme';

const THUMB = 22;
const TRACK = 6;

const makeStyles = (colors) =>
  StyleSheet.create({
    touchArea: { height: 36, justifyContent: 'center' },
    track: { height: TRACK, borderRadius: radius.round, backgroundColor: colors.border },
    fill: { height: TRACK, borderRadius: radius.round, backgroundColor: colors.primary },
    thumb: {
      position: 'absolute',
      top: (36 - THUMB) / 2,
      width: THUMB,
      height: THUMB,
      borderRadius: radius.round,
      backgroundColor: colors.primary,
      borderWidth: 3,
      borderColor: colors.surface,
      elevation: 3,
    },
  });

/**
 * @param {number} share 0..1 how far the trip has played
 * @param {function} onSeek Called with a share 0..1 while the user taps or drags
 */
export default function ProgressBar({ share, onSeek }) {
  const styles = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  const widthRef = useRef(0);
  const onSeekRef = useRef(onSeek);
  onSeekRef.current = onSeek;

  const panResponder = useMemo(() => {
    const seekTo = (locationX) => {
      if (widthRef.current > 0) {
        onSeekRef.current(locationX / widthRef.current);
      }
    };
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (event) => seekTo(event.nativeEvent.locationX),
      onPanResponderMove: (event) => seekTo(event.nativeEvent.locationX),
    });
  }, []);

  const clamped = Math.min(Math.max(share, 0), 1);

  return (
    <View
      style={styles.touchArea}
      onLayout={(event) => {
        widthRef.current = event.nativeEvent.layout.width;
        setWidth(event.nativeEvent.layout.width);
      }}
      {...panResponder.panHandlers}
    >
      <View style={styles.track}>
        <View style={[styles.fill, { width: `${clamped * 100}%` }]} />
      </View>
      <View pointerEvents="none" style={[styles.thumb, { left: clamped * width - THUMB / 2 }]} />
    </View>
  );
}
