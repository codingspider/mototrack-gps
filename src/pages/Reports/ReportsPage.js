// The Reports tab: a grid of compact report cards that share the screen height, so no scrolling is needed.
// Tapping a card opens that report.
import React from 'react';
import { ScrollView, StyleSheet, View } from 'react-native';
import { useDispatch } from 'react-redux';
import AppText from '../../components/common/AppText';
import routeNames from '../../routes/routeNames';
import { showToast } from '../../store/slices/toastSlice';
import { HUB_CARDS } from '../../utils/reportConfigs';
import { spacing, useAppTheme, useThemedStyles } from '../../theme';
import ReportCard from './components/ReportCard';

const MIN_ROW_HEIGHT = 74; // on a very short screen the page scrolls instead of squeezing the cards

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    // flexGrow: 1 lets the rows share all the free height
    content: { flexGrow: 1, padding: spacing.md, gap: spacing.sm },
    row: { flex: 1, flexDirection: 'row', gap: spacing.sm, minHeight: MIN_ROW_HEIGHT },
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
      <AppText variant="caption" color={colors.textSecondary}>
        Pick a report, then choose vehicle and dates
      </AppText>
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
