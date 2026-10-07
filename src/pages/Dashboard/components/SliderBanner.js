// Home sliders from the server (full width, like the design). Tapping opens the slider link, if any.
import React, { useState } from 'react';
import { FlatList, Image, Linking, Pressable, StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import { selectSliders } from '../../../store/slices/appSlice';
import { colors, radius, spacing } from '../../../theme';

const SLIDE_HEIGHT = 138;

export default function SliderBanner() {
  const sliders = useSelector(selectSliders).filter((slider) => !!slider.image);
  const [width, setWidth] = useState(0);
  const [activeIndex, setActiveIndex] = useState(0);

  if (sliders.length === 0) {
    return null;
  }

  const openLink = (link) => {
    if (link && link.startsWith('https://')) {
      Linking.openURL(link);
    }
  };

  return (
    <View style={styles.wrapper} onLayout={(event) => setWidth(event.nativeEvent.layout.width)}>
      {width > 0 && (
        <FlatList
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          data={sliders}
          keyExtractor={(item) => String(item.id)}
          onMomentumScrollEnd={(event) => setActiveIndex(Math.round(event.nativeEvent.contentOffset.x / width))}
          renderItem={({ item }) => (
            <Pressable onPress={() => openLink(item.link)}>
              <Image source={{ uri: item.image }} style={[styles.image, { width }]} resizeMode="cover" />
            </Pressable>
          )}
        />
      )}
      {sliders.length > 1 && (
        <View style={styles.dots}>
          {sliders.map((slider, index) => (
            <View key={slider.id} style={[styles.dot, index === activeIndex && styles.dotActive]} />
          ))}
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: { borderRadius: radius.lg, overflow: 'hidden', backgroundColor: colors.skeleton },
  image: { height: SLIDE_HEIGHT },
  dots: { position: 'absolute', right: spacing.md, bottom: spacing.sm, flexDirection: 'row', gap: spacing.xs },
  dot: { width: 6, height: 6, borderRadius: radius.round, backgroundColor: colors.surface, opacity: 0.6 },
  dotActive: { width: 16, opacity: 1 },
});
