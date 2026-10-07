// Home sliders from the server (full width, like the design). Changes slide by itself every few seconds.
// Tapping a slide opens its link, if any.
import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectSliders } from '../../../store/slices/appSlice';
import { radius, spacing, useThemedStyles } from '../../../theme';

const SLIDE_HEIGHT = 165;
const AUTO_CHANGE_MS = 4000;

const makeStyles = (colors) =>
  StyleSheet.create({
    wrapper: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.skeleton },
    image: { height: SLIDE_HEIGHT },
    dots: { position: 'absolute', right: spacing.md, bottom: spacing.sm, flexDirection: 'row', gap: spacing.xs },
    dot: { width: 6, height: 6, borderRadius: radius.round, backgroundColor: colors.textOnPrimary, opacity: 0.6 },
    dotActive: { width: 16, opacity: 1 },
  });

export default function SliderBanner() {
  const styles = useThemedStyles(makeStyles);
  const sliders = useSelector(selectSliders).filter((slider) => !!slider.image);
  const listRef = useRef(null);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);
  const slideCount = sliders.length;

  // Refs hold the live values so the timer below never needs to restart on a swipe.
  const activeIndexRef = useRef(0);
  const isDraggingRef = useRef(false);

  const goToIndex = (index) => {
    activeIndexRef.current = index;
    setActiveIndex(index);
  };

  // Every few seconds move to the next slide (back to the first after the last).
  useEffect(() => {
    if (slideCount < 2 || width === 0) {
      return undefined;
    }
    const timer = setInterval(() => {
      if (isDraggingRef.current) {
        return; // the user is swiping, leave it alone
      }
      const nextIndex = (activeIndexRef.current + 1) % slideCount;
      listRef.current?.scrollToOffset({ offset: nextIndex * width, animated: true });
      goToIndex(nextIndex);
    }, AUTO_CHANGE_MS);
    return () => clearInterval(timer);
  }, [slideCount, width]);

  if (slideCount === 0) {
    return null;
  }

  const openLink = (link) => {
    if (link && link.startsWith('https://')) {
      Linking.openURL(link);
    }
  };

  // Called after a swipe settles: remember which slide the user stopped on.
  const handleScrollEnd = (event) => {
    isDraggingRef.current = false;
    goToIndex(Math.round(event.nativeEvent.contentOffset.x / width));
  };

  return (
    <View style={styles.wrapper} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          ref={listRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={sliders}
          keyExtractor={(item) => String(item.id)}
          onScrollBeginDrag={() => {
            isDraggingRef.current = true;
          }}
          onScrollEndDrag={() => {
            isDraggingRef.current = false;
          }}
          onMomentumScrollEnd={handleScrollEnd}
          renderItem={({ item }) => (
            <Pressable onPress={() => openLink(item.link)}>
              <Image source={{ uri: item.image }} style={[styles.image, { width }]} resizeMode="cover" />
            </Pressable>
          )}
        />
      )}
      {slideCount > 1 && (
        <View style={styles.dots}>
          {sliders.map((slider, index) => (
            <View key={slider.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}
