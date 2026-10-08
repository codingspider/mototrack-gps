// One card on the Reports page: tinted icon, title, short description and a small arrow.
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Icon } from 'react-native-paper';
import AppText from '../../../components/common/AppText';
import Card from '../../../components/common/Card';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../../theme';
import { getToneColors } from '../reportTones';

const makeStyles = (colors) =>
  StyleSheet.create({
    card: { flex: 1, padding: spacing.md, borderRadius: radius.lg },
    top: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: spacing.sm },
    iconCircle: { width: 40, height: 40, borderRadius: radius.round, alignItems: 'center', justifyContent: 'center' },
    title: { fontWeight: '800' },
  });

/**
 * @param {object} report Card definition from utils/reportConfigs (icon, tone, title, hubSubtitle)
 * @param {function} onPress
 */
export default function ReportCard({ report, onPress }) {
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);
  const tone = getToneColors(report.tone, colors);

  return (
    <Card style={styles.card} onPress={onPress}>
      <View>
        <View style={styles.top}>
          <View style={[styles.iconCircle, { backgroundColor: tone.bg }]}>
            <Icon source={report.icon} size={22} color={tone.fg} />
          </View>
          <Icon source="arrow-top-right" size={18} color={colors.textMuted} />
        </View>
        <AppText style={styles.title} numberOfLines={1}>
          {report.title}
        </AppText>
        <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
          {report.hubSubtitle}
        </AppText>
      </View>
    </Card>
  );
}
