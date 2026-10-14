// The five summary boxes of the Daily activity report: vehicle, report period, total km, today's km and
// total km since the GPS was installed.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme } from '../../../theme';
import { sinceLabel } from '../../../utils/dailyActivity';
import { useTranslation } from '../../../i18n/LanguageContext';

const kmText = (value) => `${value.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} km`;

/** @param {object} data Parsed report (see parseDailyActivity) */
export default function DailySummaryCards({ data }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const items = [
    { key: 'vehicle', icon: 'car', color: colors.secondary, label: t('Vehicle'), value: data.vehicleName || '-' },
    {
      key: 'period',
      icon: 'calendar-month',
      color: colors.statusOnline,
      label: t('Report period'),
      value: `${data.periodDays} ${data.periodDays === 1 ? 'day' : 'days'}`,
    },
    { key: 'total', icon: 'road-variant', color: colors.info, label: t('Total KM (selected period)'), value: kmText(data.totalKm) },
    { key: 'today', icon: 'white-balance-sunny', color: colors.primary, label: t("Today's KM"), value: kmText(data.todayKm) },
    {
      key: 'since',
      icon: 'speedometer',
      color: colors.statusOnline,
      label: data.sinceDate
        ? t('Total KM since GPS installed ({date})', { date: sinceLabel(data.sinceDate) })
        : t('Total KM since GPS installed'),
      value: kmText(data.sinceKm),
    },
  ];

  return (
    <View style={styles.grid}>
      {items.map((item) => (
        <Card key={item.key} style={[styles.card, item.key === 'since' && styles.wide]}>
          <View style={styles.row}>
            <View style={[styles.iconCircle, { backgroundColor: `${item.color}22` }]}>
              <Icon source={item.icon} size={20} color={item.color} />
            </View>
            <View style={styles.text}>
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={2}>
                {item.label}
              </AppText>
              <AppText style={styles.value} numberOfLines={2}>
                {item.value}
              </AppText>
            </View>
          </View>
        </Card>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  card: { flexGrow: 1, flexBasis: '47%', padding: spacing.md, borderRadius: radius.lg },
  wide: { flexBasis: '100%' },
  row: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  iconCircle: { width: 36, height: 36, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
  text: { flex: 1 },
  value: { fontWeight: '800' },
});
