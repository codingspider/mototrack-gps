// The card above the action row has two pages: the live speedometer (opens first) and the vehicle summary (with
// Recharge now).
// Two small tabs under it show which page is open and switch between them (swiping the card works too).
// Both pages have the same height.
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { useTranslation } from '../../../i18n/LanguageContext';
import { radius, spacing, useAppTheme } from '../../../theme';
import SpeedDashboard from './SpeedDashboard';
import VehicleInfoCard from './VehicleInfoCard';

// The speedometer is the first page (the one that opens); the vehicle summary with Recharge now is the second
const TABS = [
  { key: 'speed', icon: 'speedometer', labelKey: 'dash.tabSpeed' },
  { key: 'details', icon: 'card-text-outline', labelKey: 'dash.tabDetails' },
];

/** @param {number} vehicleId The vehicle both pages are about */
export default function SummaryPager({ vehicleId }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const [pageWidth, setPageWidth] = useState(0);
  const [infoHeight, setInfoHeight] = useState(0);
  const [pageIndex, setPageIndex] = useState(0);
  const scrollRef = useRef(null);

  // Swiped by hand: remember which page the card stopped on
  const handleScrollEnd = (event) => {
    if (pageWidth > 0) {
      setPageIndex(Math.round(event.nativeEvent.contentOffset.x / pageWidth));
    }
  };

  // Tapped a tab: slide the card to that page
  const openPage = (index) => {
    setPageIndex(index);
    scrollRef.current?.scrollTo({ x: index * pageWidth, animated: true });
  };

  return (
    <View onLayout={(event) => setPageWidth(event.nativeEvent.layout.width)}>
      <ScrollView
        ref={scrollRef}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={handleScrollEnd}
      >
        <View style={{ width: pageWidth || undefined }}>
          <SpeedDashboard vehicleId={vehicleId} minHeight={infoHeight} />
        </View>
        <View style={{ width: pageWidth || undefined }} onLayout={(event) => setInfoHeight(event.nativeEvent.layout.height)}>
          <VehicleInfoCard vehicleId={vehicleId} />
        </View>
      </ScrollView>
      <View style={styles.tabs}>
        {TABS.map((tab, index) => {
          const isActive = index === pageIndex;
          const contentColor = isActive ? colors.textOnPrimary : colors.primary;
          return (
            <TouchableRipple
              key={tab.key}
              borderless
              style={[styles.tab, { backgroundColor: isActive ? colors.primary : colors.surface, borderColor: colors.primary }]}
              onPress={() => openPage(index)}
              accessibilityLabel={t(tab.labelKey)}
            >
              <View style={styles.tabContent}>
                <Icon source={tab.icon} size={16} color={contentColor} />
                <AppText variant="caption" color={contentColor} style={styles.tabLabel}>
                  {t(tab.labelKey)}
                </AppText>
              </View>
            </TouchableRipple>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  tabs: { flexDirection: 'row', justifyContent: 'center', gap: spacing.sm, marginTop: spacing.xs },
  tab: { borderRadius: radius.round, borderWidth: 1 },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
  },
  tabLabel: { fontWeight: '700' },
});
