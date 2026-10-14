// One device on the Warranty page: name, plate, status, the countdown in days / hours / minutes and a bar of the time left.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { useSelector } from 'react-redux';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import VehicleIconBadge from '../../../components/vehicle/VehicleIconBadge';
import { useTranslation } from '../../../i18n/LanguageContext';
import { selectVehicleById } from '../../../store/slices/vehiclesSlice';
import { formatDateOnly } from '../../../utils/formatDate';
import { getRemainingShare, getSecondsLeft, splitSeconds } from '../../../utils/warranty';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';

const BADGE_SIZE = 40;
const LOW_DAYS = 30; // the countdown turns amber below this many days

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { marginBottom: spacing.sm, padding: spacing.md, gap: spacing.sm },
    top: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    names: { flex: 1 },
    name: { fontWeight: '800' },
    chip: { paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: radius.round },
    chipText: { fontWeight: '700' },
    boxes: { flexDirection: 'row', gap: spacing.sm },
    box: {
      flex: 1,
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.background,
      borderWidth: 1,
      borderColor: colors.border,
    },
    boxNumber: { fontWeight: '800', fontSize: 22 },
    track: { height: 6, borderRadius: radius.round, backgroundColor: colors.border, overflow: 'hidden' },
    fill: { height: 6 },
    dates: { flexDirection: 'row', justifyContent: 'space-between' },
  });

/**
 * @param {object} item One row from parseWarranties
 * @param {number} fetchedAt When the list arrived (ms)
 * @param {number} nowMs Current time (the page ticks it once a minute)
 */
function WarrantyRow({ item, fetchedAt, nowMs }) {
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const vehicle = useSelector(selectVehicleById(item.deviceId));

  const secondsLeft = item.isExpired ? 0 : getSecondsLeft(item.secondsLeft, fetchedAt, nowMs);
  const isExpired = item.isExpired || secondsLeft <= 0;
  const { days, hours, minutes } = splitSeconds(secondsLeft);
  const share = isExpired ? 0 : getRemainingShare(item.startDate, item.endDate, secondsLeft);

  let tone = colors.statusOnline;
  if (isExpired) {
    tone = colors.secondary;
  } else if (days < LOW_DAYS) {
    tone = colors.accent;
  }

  const boxes = [
    { key: 'days', value: days, label: t('warranty.days') },
    { key: 'hours', value: hours, label: t('warranty.hours') },
    { key: 'minutes', value: minutes, label: t('warranty.minutes') },
  ];

  return (
    <Card style={styles.card}>
      <View style={styles.top}>
        {vehicle ? <VehicleIconBadge vehicle={vehicle} size={BADGE_SIZE} /> : null}
        <View style={styles.names}>
          <AppText style={styles.name} numberOfLines={1}>
            {item.name}
          </AppText>
          {!!item.plateNumber && (
            <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
              {item.plateNumber}
            </AppText>
          )}
        </View>
        <View style={[styles.chip, { backgroundColor: `${tone}22` }]}>
          <AppText variant="caption" color={tone} style={styles.chipText}>
            {isExpired ? t('warranty.expired') : t('warranty.active')}
          </AppText>
        </View>
      </View>

      <View style={styles.boxes}>
        {boxes.map((box) => (
          <View key={box.key} style={styles.box}>
            <AppText style={styles.boxNumber} color={isExpired ? colors.textSecondary : tone}>
              {box.value}
            </AppText>
            <AppText variant="caption" color={colors.textSecondary}>
              {box.label}
            </AppText>
          </View>
        ))}
      </View>

      <View style={styles.track}>
        <View style={[styles.fill, { width: `${Math.round(share * 100)}%`, backgroundColor: tone }]} />
      </View>

      <View style={styles.dates}>
        <AppText variant="caption" color={colors.textSecondary}>
          {`${t('warranty.from')} ${item.startDate ? formatDateOnly(item.startDate) : '-'}`}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary}>
          {`${t('warranty.until')} ${item.endDate ? formatDateOnly(item.endDate) : '-'}`}
        </AppText>
      </View>
    </Card>
  );
}

export default React.memo(WarrantyRow);
