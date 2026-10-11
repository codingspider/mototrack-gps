// The list of places that match what was typed. The From box also offers "My location" at the top.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { Icon, TouchableRipple } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import { spacing, useAppTheme, useThemedStyles } from '../../../theme';

const makeStyles = (colors) =>
  StyleSheet.create({
    list: { flex: 1, backgroundColor: colors.surface },
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
      padding: spacing.md,
      borderBottomWidth: StyleSheet.hairlineWidth,
      borderBottomColor: colors.border,
    },
    text: { flex: 1 },
    note: { padding: spacing.lg },
  });

/**
 * @param {Array<{ placeId: string, title: string, subtitle: string }>} items
 * @param {boolean} isLoading
 * @param {string|null} error
 * @param {boolean} hasQuery Something has been typed
 * @param {boolean} showMyLocation Offer "My location" (the From box)
 * @param {function} onPick Called with a place item
 * @param {function} onPickMyLocation
 */
export default function PlaceResults({ items, isLoading, error, hasQuery, showMyLocation, onPick, onPickMyLocation }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  return (
    <ScrollView style={styles.list} keyboardShouldPersistTaps="handled">
      {showMyLocation && (
        <TouchableRipple onPress={onPickMyLocation}>
          <View style={styles.row}>
            <Icon source="crosshairs-gps" size={22} color={colors.primary} />
            <AppText style={styles.text}>My location</AppText>
          </View>
        </TouchableRipple>
      )}
      {items.map((item) => (
        <TouchableRipple key={item.placeId} onPress={() => onPick(item)}>
          <View style={styles.row}>
            <Icon source="map-marker-outline" size={22} color={colors.textSecondary} />
            <View style={styles.text}>
              <AppText numberOfLines={1}>{item.title}</AppText>
              {!!item.subtitle && (
                <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                  {item.subtitle}
                </AppText>
              )}
            </View>
          </View>
        </TouchableRipple>
      ))}
      {!!error && (
        <AppText style={styles.note} color={colors.secondary}>
          {error}
        </AppText>
      )}
      {!error && hasQuery && !isLoading && items.length === 0 && (
        <AppText style={styles.note} color={colors.textSecondary}>
          No places found
        </AppText>
      )}
      {!hasQuery && !showMyLocation && (
        <AppText style={styles.note} color={colors.textSecondary}>
          Type a place, for example Dhaka
        </AppText>
      )}
    </ScrollView>
  );
}
