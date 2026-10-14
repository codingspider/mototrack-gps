// One card on the Reports page: small tinted icon, title, short description and a tiny arrow. Compact on purpose,
// so every report fits on one screen.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { getToneColors } from '../reportTones';
import { useTranslation } from '../../../i18n/LanguageContext';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { flex: 1, padding: spacing.sm, paddingHorizontal: spacing.md, borderRadius: radius.md, justifyContent: 'center' },
    top: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.xs },
    iconCircle: { width: 30, height: 30, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    title: { fontWeight: '800', fontSize: 14 },
    subtitle: { fontSize: 11 },
  });

/**
 * @param {object} report Card definition from utils/reportConfigs (icon, tone, title, hubSubtitle)
 * @param {function} onPress
 */
export default function ReportCard({ report, onPress }) {
  const { t } = useTranslation();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = getToneColors(report.tone, colors);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View>
        <View style={styles.top}>
          <View style={[styles.iconCircle, { backgroundColor: tone.bg }]}>
            <Icon source={report.icon} size={18} color={tone.fg} />
          </View>
          <Icon source="arrow-top-right" size={14} color={colors.textMuted} />
        </View>
        <AppText style={styles.title} numberOfLines={1}>
          {t(report.title)}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} style={styles.subtitle} numberOfLines={1}>
          {t(report.hubSubtitle)}
        </AppText>
      </View>
    </Card>
  );
}
