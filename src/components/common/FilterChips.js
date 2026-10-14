// A horizontal row of filter chips with a count in each, e.g. "Moving 2". Used by the Vehicles list and the Live map.
import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { Chip } from 'react-native-paper';
import { spacing, useAppTheme } from '../../theme';
import { useTranslation } from '../../i18n/LanguageContext';

/**
 * @param {{ key: string, label: string }[]} filters
 * @param {string} selectedKey
 * @param {object} counts { [key]: number }
 * @param {function} onSelect Called with the chip key
 */
export default function FilterChips({ filters, selectedKey, counts, onSelect }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();

  return (
    <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.row}>
      {filters.map((filter) => {
        const isSelected = filter.key === selectedKey;
        return (
          <Chip
            key={filter.key}
            selected={isSelected}
            showSelectedCheck={false}
            onPress={() => onSelect(filter.key)}
            style={{ backgroundColor: isSelected ? colors.primary : colors.surface }}
            textStyle={{ color: isSelected ? colors.textOnPrimary : colors.text }}
          >
            {`${filter.labelKey ? t(filter.labelKey) : filter.label} ${counts[filter.key] ?? 0}`}
          </Chip>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  row: { paddingHorizontal: spacing.md, gap: spacing.sm, alignItems: 'center' },
});
