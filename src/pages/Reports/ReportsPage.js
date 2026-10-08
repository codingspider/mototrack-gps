// The Reports tab: a grid of report cards. Tapping a card opens that report.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import AppText from '../../components/common/AppText';
import routeNames from '../../routes/routeNames';
import { showToast } from '../../store/slices/toastSlice';
import { HUB_CARDS } from '../../utils/reportConfigs';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import ReportCard from './components/ReportCard';

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    content: { padding: spacing.lg, gap: spacing.md, paddingBottom: spacing.xxl },
    row: { flexDirection: 'row', gap: spacing.md },
    spacer: { flex: 1 },
  });

export default function ReportsPage({ navigation }) {
  const dispatch = useDispatch();
  const { colors } = useAppTheme();
  const styles = useThemedStyles(makeStyles);

  const openReport = (report) => {
    if (report.isReady === false) {
      dispatch(showToast({ type: 'info', message: `${report.title} is coming soon` }));
      return;
    }
    navigation.navigate(routeNames.reportView, { type: report.key });
  };

  // Two cards per row
  const rows = [];
  for (let index = 0; index < HUB_CARDS.length; index += 2) {
    rows.push(HUB_CARDS.slice(index, index + 2));
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      <AppText color={colors.textSecondary}>Pick a report, then choose vehicle and dates</AppText>
      {rows.map((pair) => (
        <View key={pair[0].key} style={styles.row}>
          {pair.map((report) => (
            <ReportCard key={report.key} report={report} onPress={() => openReport(report)} />
          ))}
          {pair.length === 1 && <View style={styles.spacer} />}
        </View>
      ))}
    </ScrollView>
  );
}
