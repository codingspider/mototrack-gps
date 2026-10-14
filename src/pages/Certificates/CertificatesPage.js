// Certificates (opened from Profile): the customer's devices, each with a View and a Download button for its
// registration certificate. View opens the certificate inside the app; Download hands the PDF to the phone.
import React, { useCallback, useState } from 'react';
import { FlatList, StyleSheet, TextInput, View } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useDispatch } from 'react-redux';
import { getCertificateLinks } from '../../api/certificateApi';
import AppButton from '../../components/common/AppButton';
import AppRefreshControl from '../../components/common/AppRefreshControl';
import AppText from '../../components/common/AppText';
import Card from '../../components/common/Card';
import EmptyState from '../../components/common/EmptyState';
import ErrorState from '../../components/common/ErrorState';
import Skeleton from '../../components/skeleton/Skeleton';
import VehicleIconBadge from '../../components/vehicle/VehicleIconBadge';
import useRefreshSlotStyle from '../../hooks/useRefreshSlotStyle';
import useVehicles from '../../hooks/useVehicles';
import { useTranslation } from '../../i18n/LanguageContext';
import routeNames from '../../routes/routeNames';
import { showToast } from '../../store/slices/toastSlice';
import { downloadFile, makeFileName } from '../../utils/appDownload';
import { filterVehicles } from '../../utils/vehicleFilter';
import { radius, spacing, useAppTheme, useThemedStyles } from '../../theme';

const BADGE_SIZE = 40;

const makeStyles = (colors) =>
  StyleSheet.create({
    screen: { flex: 1, backgroundColor: colors.background },
    search: {
      margin: spacing.md,
      marginBottom: spacing.sm,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: radius.md,
      backgroundColor: colors.surface,
      borderWidth: 1,
      borderColor: colors.border,
      color: colors.text,
    },
    list: { paddingHorizontal: spacing.md, paddingBottom: spacing.xxl },
    card: { marginBottom: spacing.sm, padding: spacing.md },
    row: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
    names: { flex: 1 },
    name: { fontWeight: '800' },
    buttons: { flexDirection: 'row', gap: spacing.sm, marginTop: spacing.md },
    button: { flex: 1 },
    skeleton: { padding: spacing.md, gap: spacing.sm },
    skeletonBlock: { borderRadius: radius.md },
  });

export default function CertificatesPage() {
  const refreshSlot = useRefreshSlotStyle();
  const dispatch = useDispatch();
  const navigation = useNavigation();
  const { colors } = useAppTheme();
  const { t } = useTranslation();
  const styles = useThemedStyles(makeStyles);
  const { vehicles, isLoading, error, refresh } = useVehicles();
  const [query, setQuery] = useState('');
  // Which row and button is busy: { deviceId, action: 'view' | 'download' } or null
  const [busy, setBusy] = useState(null);

  const open = useCallback(
    async (vehicle, action) => {
      if (busy) {
        return;
      }
      setBusy({ deviceId: vehicle.id, action });
      try {
        const answer = await getCertificateLinks(vehicle.id);
        const url = action === 'view' ? answer && answer.view_url : answer && answer.download_url;
        if (!answer || answer.status !== 1 || !url) {
          throw new Error((answer && answer.message) || t('cert.failed'));
        }
        if (action === 'view') {
          navigation.navigate(routeNames.certificateView, { url, title: vehicle.plate_number || vehicle.device_name });
        } else {
          // Straight into the phone's Downloads folder; Android shows its own download notification
          const fileName = makeFileName(vehicle.plate_number || vehicle.device_name, String(vehicle.id));
          const how = await downloadFile(url, fileName, vehicle.plate_number || vehicle.device_name);
          if (how === 'downloading') {
            dispatch(showToast({ type: 'success', message: t('cert.downloading') }));
          }
        }
      } catch (problem) {
        // The server answers 404 "endpoint ... could not be found" while the certificate route is not installed
        const isMissing = /could not be found|not found|404/i.test(problem.message || '');
        dispatch(showToast({ type: 'error', message: isMissing ? t('cert.notReady') : problem.message || t('cert.failed') }));
      } finally {
        setBusy(null);
      }
    },
    [busy, dispatch, navigation, t],
  );

  if (isLoading && vehicles.length === 0) {
    return (
      <View style={styles.skeleton}>
        {[0, 1, 2, 3, 4].map((index) => (
          <Skeleton key={index} height={110} style={styles.skeletonBlock} />
        ))}
      </View>
    );
  }
  if (error && vehicles.length === 0) {
    return <ErrorState message={error} onRetry={refresh} />;
  }

  const visible = filterVehicles(vehicles, 'all', query);

  const renderItem = ({ item }) => {
    const isViewBusy = busy && busy.deviceId === item.id && busy.action === 'view';
    const isDownloadBusy = busy && busy.deviceId === item.id && busy.action === 'download';
    return (
      <Card style={styles.card}>
        <View style={styles.row}>
          <VehicleIconBadge vehicle={item} size={BADGE_SIZE} />
          <View style={styles.names}>
            <AppText style={styles.name} numberOfLines={1}>
              {item.device_name}
            </AppText>
            {!!item.plate_number && (
              <AppText variant="caption" color={colors.textSecondary} numberOfLines={1}>
                {item.plate_number}
              </AppText>
            )}
          </View>
        </View>
        <View style={styles.buttons}>
          <AppButton
            title={t('cert.view')}
            icon="eye-outline"
            isCompact
            isLoading={!!isViewBusy}
            isDisabled={!!busy}
            onPress={() => open(item, 'view')}
            style={styles.button}
          />
          <AppButton
            title={t('cert.download')}
            icon="file-pdf-box"
            variant="secondary"
            isCompact
            isLoading={!!isDownloadBusy}
            isDisabled={!!busy}
            onPress={() => open(item, 'download')}
            style={styles.button}
          />
        </View>
      </Card>
    );
  };

  return (
    <View style={styles.screen}>
      <TextInput
        style={styles.search}
        value={query}
        onChangeText={setQuery}
        placeholder={t('vehicles.search')}
        placeholderTextColor={colors.textSecondary}
      />
      <FlatList
        data={visible}
        keyExtractor={(item) => String(item.id)}
        renderItem={renderItem}
        contentContainerStyle={[styles.list, refreshSlot]}
        keyboardShouldPersistTaps="handled"
        refreshControl={<AppRefreshControl refreshing={isLoading} onRefresh={refresh} />}
        ListEmptyComponent={<EmptyState text={vehicles.length === 0 ? t('vehicles.none') : t('vehicles.noMatch')} />}
      />
    </View>
  );
}
